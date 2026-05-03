from __future__ import annotations

from dataclasses import dataclass, field
import random
from typing import Literal

Player = str
Phase = Literal["roll", "buy", "end", "finished"]
GO_MONEY = 200
START_CASH = 1500
MAX_PLAYERS = 4


class IllegalAction(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class Space:
    id: int
    name: str
    kind: Literal["go", "property", "tax", "chance", "chest", "jail", "go_to_jail", "free_parking", "railroad", "utility"]
    price: int = 0
    rent: int = 0
    color: str | None = None
    house_cost: int = 0
    rents: tuple[int, int, int, int, int, int] = (0, 0, 0, 0, 0, 0)  # base, 1h, 2h, 3h, 4h, hotel


# Original 40-space board, Monopoly-like cadence, Panda Capital names.
BOARD: tuple[Space, ...] = (
    Space(0, "Štart / Výplata z účtu", "go"),
    Space(1, "Povraznícka ulička", "property", 60, 2, "brown", 50, (2, 10, 30, 90, 160, 250)),
    Space(2, "Spoločná kasa", "chest"),
    Space(3, "Kramárska spojka", "property", 60, 4, "brown", 50, (4, 20, 60, 180, 320, 450)),
    Space(4, "Daň z cloudu", "tax", rent=200),
    Space(5, "Električka 4 Express", "railroad", 200, 25, "railroad"),
    Space(6, "Račianska radiála", "property", 100, 6, "light-blue", 50, (6, 30, 90, 270, 400, 550)),
    Space(7, "Náhoda: slovenský incident", "chance"),
    Space(8, "Nivy terminál", "property", 100, 6, "light-blue", 50, (6, 30, 90, 270, 400, 550)),
    Space(9, "Trnavské mýto", "property", 120, 8, "light-blue", 50, (8, 40, 100, 300, 450, 600)),
    Space(10, "Väzenie / len návšteva úradu", "jail"),
    Space(11, "Mlynská dolina", "property", 140, 10, "pink", 100, (10, 50, 150, 450, 625, 750)),
    Space(12, "ZSE LLM rozvodňa", "utility", 150, 0, "utility"),
    Space(13, "Slavínsky výhľad", "property", 140, 10, "pink", 100, (10, 50, 150, 450, 625, 750)),
    Space(14, "Medická záhrada", "property", 160, 12, "pink", 100, (12, 60, 180, 500, 700, 900)),
    Space(15, "Hlavná stanica Rail", "railroad", 200, 25, "railroad"),
    Space(16, "Obchodná bugfixová", "property", 180, 14, "orange", 100, (14, 70, 200, 550, 750, 950)),
    Space(17, "Spoločná kasa", "chest"),
    Space(18, "Špitálska agentov", "property", 180, 14, "orange", 100, (14, 70, 200, 550, 750, 950)),
    Space(19, "Panda HQ Povraznícka", "property", 200, 16, "orange", 100, (16, 80, 220, 600, 800, 1000)),
    Space(20, "Free Parking / gauč pauza", "free_parking"),
    Space(21, "Aupark pasáž", "property", 220, 18, "red", 150, (18, 90, 250, 700, 875, 1050)),
    Space(22, "Náhoda: product pivot", "chance"),
    Space(23, "Eurovea nábrežie", "property", 220, 18, "red", 150, (18, 90, 250, 700, 875, 1050)),
    Space(24, "Dunajská promenáda", "property", 240, 20, "red", 150, (20, 100, 300, 750, 925, 1100)),
    Space(25, "Nivy Bus Rail", "railroad", 200, 25, "railroad"),
    Space(26, "SalesPanda sklad", "property", 260, 22, "yellow", 150, (22, 110, 330, 800, 975, 1150)),
    Space(27, "TidyCal veža", "property", 260, 22, "yellow", 150, (22, 110, 330, 800, 975, 1150)),
    Space(28, "Bratislavská vodáreň API", "utility", 150, 0, "utility"),
    Space(29, "Rozsudky.ai rad", "property", 280, 24, "yellow", 150, (24, 120, 360, 850, 1025, 1200)),
    Space(30, "Choď do väzenia / rate limit", "go_to_jail"),
    Space(31, "Luna Labs Kramáre", "property", 300, 26, "green", 200, (26, 130, 390, 900, 1100, 1275)),
    Space(32, "Angelina Avenue", "property", 300, 26, "green", 200, (26, 130, 390, 900, 1100, 1275)),
    Space(33, "Spoločná kasa", "chest"),
    Space(34, "Viedenský loop", "property", 320, 28, "green", 200, (28, 150, 450, 1000, 1200, 1400)),
    Space(35, "RegioJet Actions Rail", "railroad", 200, 25, "railroad"),
    Space(36, "Náhoda: demo bohovia", "chance"),
    Space(37, "Ortoart Orbit", "property", 350, 35, "dark-blue", 200, (35, 175, 500, 1100, 1300, 1500)),
    Space(38, "Luxusná cloud faktúra", "tax", rent=100),
    Space(39, "Lunomedic Lane", "property", 400, 50, "dark-blue", 200, (50, 200, 600, 1400, 1700, 2000)),
)
BUYABLE = {"property", "railroad", "utility"}
PROPERTY_COLORS = {s.color for s in BOARD if s.kind == "property"}

CHANCE_CARDS: tuple[tuple[str, int | None], ...] = (
    ("Advance to GO. Collect €200.", 0),
    ("A demo lands. Collect €150.", 150),
    ("Speeding fine from the deploy police. Pay €50.", -50),
    ("Go directly to Jail. Do not pass GO.", -9999),
    ("Move back 3 spaces. Classic cursed card.", -3),
    ("Consulting invoice paid. Collect €100.", 100),
)
CHEST_CARDS: tuple[tuple[str, int | None], ...] = (
    ("Old cloud credits refunded. Collect €100.", 100),
    ("Server bill surprise. Pay €100.", -100),
    ("Birthday money from the bank. Collect €50.", 50),
    ("Emergency maintenance. Pay €50.", -50),
    ("Get out of Jail free-ish. Collect a rate-limit pass.", None),
    ("Bug bounty. Collect €200.", 200),
)


@dataclass(slots=True)
class PlayerState:
    cash: int = START_CASH
    position: int = 0
    jail_turns: int = 0
    jail_cards: int = 0
    active: bool = True


@dataclass(slots=True)
class GameState:
    id: str
    players: list[Player]
    names: dict[Player, str]
    turn: Player
    phase: Phase = "roll"
    player_state: dict[Player, PlayerState] = field(default_factory=dict)
    owners: dict[int, Player] = field(default_factory=dict)
    buildings: dict[int, int] = field(default_factory=dict)  # 0..5 (5=hotel)
    last_roll: tuple[int, int] | None = None
    doubles_in_row: int = 0
    pending_space: int | None = None
    winner: Player | None = None
    version: int = 0
    tokens: dict[str, str] = field(default_factory=dict)
    history: list[dict] = field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


def initial_state(game_id: str, *, tokens: dict[str, str] | None = None, names: list[str] | None = None, seed: int | None = None) -> GameState:
    clean_names = [n.strip() for n in (names or ["Patrik", "Clawd"]) if n and n.strip()][:MAX_PLAYERS]
    if len(clean_names) < 2:
        clean_names = ["Patrik", "Clawd"]
    players = [f"p{i+1}" for i in range(len(clean_names))]
    state = GameState(
        id=game_id,
        players=players,
        names={p: clean_names[i] for i, p in enumerate(players)},
        turn=players[0],
        player_state={p: PlayerState() for p in players},
        tokens=tokens or {},
    )
    state.history.append({"version": 0, "type": "start", "message": f"Panda Capital started: {', '.join(clean_names)}. {clean_names[0]} moves first."})
    return state


def active_players(state: GameState) -> list[Player]:
    return [p for p in state.players if state.player_state[p].active]


def next_player(state: GameState, player: Player) -> Player:
    active = active_players(state)
    if not active:
        return player
    start = state.players.index(player)
    for step in range(1, len(state.players) + 1):
        candidate = state.players[(start + step) % len(state.players)]
        if candidate in active:
            return candidate
    return player


def color_spaces(color: str | None) -> list[int]:
    return [s.id for s in BOARD if s.kind == "property" and s.color == color]


def owns_color_set(state: GameState, player: Player, color: str | None) -> bool:
    spaces = color_spaces(color)
    return bool(spaces) and all(state.owners.get(i) == player for i in spaces)


def can_build_on(state: GameState, player: Player, space_id: int) -> bool:
    if not 0 <= space_id < len(BOARD):
        return False
    space = BOARD[space_id]
    if space.kind != "property" or state.owners.get(space_id) != player or not owns_color_set(state, player, space.color):
        return False
    if state.buildings.get(space_id, 0) >= 5 or state.player_state[player].cash < space.house_cost:
        return False
    group = color_spaces(space.color)
    mine = [state.buildings.get(i, 0) for i in group]
    return state.buildings.get(space_id, 0) <= min(mine)  # build evenly


def legal_actions(state: GameState, player: Player) -> list[dict]:
    if state.phase == "finished" or player != state.turn or not state.player_state.get(player, PlayerState(active=False)).active:
        return []
    ps = state.player_state[player]
    if state.phase == "roll":
        actions = [{"type": "roll", "label": "Roll dice"}]
        if ps.jail_turns > 0:
            if ps.cash >= 50:
                actions.insert(0, {"type": "pay_jail", "label": "Pay €50 to leave jail"})
            if ps.jail_cards > 0:
                actions.insert(0, {"type": "use_jail_card", "label": "Use rate-limit pass"})
        return actions
    if state.phase == "buy" and state.pending_space is not None:
        space = BOARD[state.pending_space]
        actions = [{"type": "skip_buy", "spaceId": space.id, "label": f"Skip {space.name}"}]
        if ps.cash >= space.price:
            actions.insert(0, {"type": "buy", "spaceId": space.id, "label": f"Buy {space.name} for €{space.price}"})
        return actions
    if state.phase == "end":
        actions = [{"type": "end_turn", "label": "End turn"}]
        for i in range(len(BOARD)):
            if can_build_on(state, player, i):
                b = state.buildings.get(i, 0)
                actions.insert(0, {"type": "build", "spaceId": i, "label": f"Build {'hotel' if b == 4 else 'house'} on {BOARD[i].name} (€{BOARD[i].house_cost})"})
        return actions
    return []


def rent_for(state: GameState, space: Space, roll_total: int | None = None) -> int:
    owner = state.owners.get(space.id)
    if not owner:
        return 0
    if space.kind == "utility":
        count = sum(1 for s in BOARD if s.kind == "utility" and state.owners.get(s.id) == owner)
        return (roll_total or 7) * (10 if count >= 2 else 4)
    if space.kind == "railroad":
        count = sum(1 for s in BOARD if s.kind == "railroad" and state.owners.get(s.id) == owner)
        return 25 * (2 ** max(0, count - 1))
    if space.kind == "property":
        buildings = state.buildings.get(space.id, 0)
        if buildings:
            return space.rents[min(buildings, 5)]
        base = space.rents[0] or space.rent
        return base * (2 if owns_color_set(state, owner, space.color) else 1)
    return 0


def net_worth(state: GameState, player: Player) -> int:
    ps = state.player_state[player]
    assets = sum(BOARD[i].price for i, owner in state.owners.items() if owner == player)
    houses = sum(state.buildings.get(i, 0) * (BOARD[i].house_cost // 2) for i, owner in state.owners.items() if owner == player)
    return ps.cash + assets + houses


def apply_action(state: GameState, player: Player, action: dict, *, seed: int | None = None) -> GameState:
    action_type = action.get("type")
    allowed = legal_actions(state, player)
    matched = False
    for candidate in allowed:
        if candidate["type"] != action_type:
            continue
        if candidate["type"] == "build" and action.get("spaceId") != candidate.get("spaceId"):
            continue
        matched = True
        break
    if not matched:
        raise IllegalAction(f"Illegal action {action_type}")
    rng = random.Random(seed) if seed is not None else random.SystemRandom()  # type: ignore[assignment]

    if action_type == "pay_jail":
        ps = state.player_state[player]
        ps.cash -= 50
        ps.jail_turns = 0
        state.history.append(event(state, "jail", player, f"{state.names[player]} paid €50 to leave Jail."))
        check_bankruptcy_and_winner(state, player)
        return bump(state)

    if action_type == "use_jail_card":
        ps = state.player_state[player]
        ps.jail_cards -= 1
        ps.jail_turns = 0
        state.history.append(event(state, "jail_card", player, f"{state.names[player]} used a rate-limit pass to leave Jail."))
        return bump(state)

    if action_type == "roll":
        d1, d2 = rng.randint(1, 6), rng.randint(1, 6)
        roll_total = d1 + d2
        state.last_roll = (d1, d2)
        ps = state.player_state[player]
        if ps.jail_turns > 0:
            if d1 == d2:
                ps.jail_turns = 0
                state.doubles_in_row = 0
                state.history.append(event(state, "jail", player, f"{state.names[player]} rolled doubles {d1}+{d2} and escaped Jail."))
                move_and_resolve(state, player, roll_total, rng)
            else:
                ps.jail_turns -= 1
                state.history.append(event(state, "jail", player, f"{state.names[player]} failed to roll doubles ({d1}+{d2}) and stays in Jail."))
                if ps.jail_turns <= 0 and ps.cash >= 50:
                    ps.cash -= 50
                    state.history.append(event(state, "jail", player, f"Third failed attempt: paid €50 and leaves next turn."))
                state.phase = "end"
            return bump(state)

        if d1 == d2:
            state.doubles_in_row += 1
            if state.doubles_in_row >= 3:
                send_to_jail(state, player, "rolled three doubles and got rate-limited into Jail")
                return bump(state)
        else:
            state.doubles_in_row = 0
        state.history.append(event(state, "roll", player, f"{state.names[player]} rolled {d1}+{d2}."))
        move_and_resolve(state, player, roll_total, rng)
        return bump(state)

    if action_type == "buy":
        space = BOARD[state.pending_space or 0]
        state.player_state[player].cash -= space.price
        state.owners[space.id] = player
        state.pending_space = None
        state.phase = "end"
        state.history.append(event(state, "buy", player, f"{state.names[player]} bought {space.name} for €{space.price}."))
        check_bankruptcy_and_winner(state, player)
        return bump(state)

    if action_type == "skip_buy":
        space = BOARD[state.pending_space or 0]
        state.pending_space = None
        state.phase = "end"
        state.history.append(event(state, "skip_buy", player, f"{state.names[player]} skipped buying {space.name}."))
        return bump(state)

    if action_type == "build":
        space_id = int(action.get("spaceId"))
        space = BOARD[space_id]
        state.player_state[player].cash -= space.house_cost
        state.buildings[space_id] = state.buildings.get(space_id, 0) + 1
        b = state.buildings[space_id]
        state.history.append(event(state, "build", player, f"{state.names[player]} built {'a hotel' if b == 5 else f'house {b}'} on {space.name} for €{space.house_cost}."))
        check_bankruptcy_and_winner(state, player)
        return bump(state)

    if action_type == "end_turn":
        finish_or_advance(state, player, extra_turn=state.doubles_in_row > 0 and state.phase == "end" and state.pending_space is None)
        return bump(state)

    raise IllegalAction(f"Unknown action {action_type}")


def move_and_resolve(state: GameState, player: Player, amount: int, rng: random.Random) -> None:
    ps = state.player_state[player]
    old = ps.position
    new = (old + amount) % len(BOARD)
    ps.position = new
    if old + amount >= len(BOARD):
        ps.cash += GO_MONEY
        state.history.append(event(state, "go", player, f"{state.names[player]} passed GO and collected €{GO_MONEY}."))
    space = BOARD[new]
    state.history.append(event(state, "land", player, f"{state.names[player]} landed on {space.name}."))
    resolve_landing(state, player, space, amount, rng)


def resolve_landing(state: GameState, player: Player, space: Space, roll_total: int, rng: random.Random) -> None:
    ps = state.player_state[player]
    owner = state.owners.get(space.id)
    if space.kind in BUYABLE and owner is None:
        state.pending_space = space.id
        state.phase = "buy"
        return
    if owner and owner != player and state.player_state[owner].active:
        rent = rent_for(state, space, roll_total)
        ps.cash -= rent
        state.player_state[owner].cash += rent
        state.history.append(event(state, "rent", player, f"Rent: {state.names[player]} pays €{rent} to {state.names[owner]}."))
    elif space.kind == "tax":
        ps.cash -= space.rent
        state.history.append(event(state, "tax", player, f"{state.names[player]} pays €{space.rent} in {space.name}."))
    elif space.kind == "chance":
        draw_card(state, player, rng.choice(CHANCE_CARDS), rng)
    elif space.kind == "chest":
        draw_card(state, player, rng.choice(CHEST_CARDS), rng)
    elif space.kind == "go_to_jail":
        send_to_jail(state, player, "was sent directly to Jail")
        return
    elif space.kind == "free_parking":
        state.history.append(event(state, "free_parking", player, f"{state.names[player]} takes a couch break on Free Parking."))
    elif space.kind == "jail":
        state.history.append(event(state, "visit_jail", player, f"{state.names[player]} is just visiting Jail. Extremely legal."))
    check_bankruptcy_and_winner(state, player)
    state.phase = "end" if state.phase != "finished" else "finished"


def draw_card(state: GameState, player: Player, card: tuple[str, int | None], rng: random.Random) -> None:
    message, effect = card
    ps = state.player_state[player]
    state.history.append(event(state, "card", player, f"Card: {message}"))
    if effect is None:
        ps.jail_cards += 1
    elif effect == 0:
        ps.position = 0
        ps.cash += GO_MONEY
    elif effect == -9999:
        send_to_jail(state, player, "drew a card sending them to Jail")
    elif effect == -3:
        ps.position = (ps.position - 3) % len(BOARD)
        resolve_landing(state, player, BOARD[ps.position], 3, rng)
    else:
        ps.cash += int(effect)


def send_to_jail(state: GameState, player: Player, reason: str) -> None:
    ps = state.player_state[player]
    ps.position = 10
    ps.jail_turns = 3
    state.doubles_in_row = 0
    state.pending_space = None
    state.phase = "end"
    state.history.append(event(state, "go_to_jail", player, f"{state.names[player]} {reason}."))


def check_bankruptcy_and_winner(state: GameState, debtor: Player | None = None) -> None:
    for p in list(active_players(state)):
        if state.player_state[p].cash < 0:
            state.player_state[p].active = False
            for sid, owner in list(state.owners.items()):
                if owner == p:
                    del state.owners[sid]
                    state.buildings.pop(sid, None)
            state.history.append(event(state, "bankrupt", p, f"{state.names[p]} went bankrupt. Properties return to bank."))
    active = active_players(state)
    if len(active) == 1:
        state.winner = active[0]
        state.phase = "finished"
        state.history.append(event(state, "finish", active[0], f"{state.names[active[0]]} is the last capitalist standing."))


def finish_or_advance(state: GameState, player: Player, *, extra_turn: bool = False) -> None:
    check_bankruptcy_and_winner(state, player)
    if state.phase == "finished":
        return
    if extra_turn and state.player_state[player].jail_turns == 0:
        state.phase = "roll"
        state.history.append(event(state, "extra_turn", player, f"{state.names[player]} rolled doubles and goes again."))
        return
    state.doubles_in_row = 0
    state.turn = next_player(state, player)
    state.phase = "roll"
    state.pending_space = None


def event(state: GameState, typ: str, player: Player, message: str) -> dict:
    return {"version": state.version + 1, "type": typ, "player": player, "message": message}


def bump(state: GameState) -> GameState:
    state.version += 1
    return state
