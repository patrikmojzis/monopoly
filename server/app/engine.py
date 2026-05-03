from __future__ import annotations

from dataclasses import dataclass, field
import random
from typing import Literal

Player = str
Phase = Literal["roll", "buy", "auction", "debt", "end", "finished"]
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
    ("Choď na Štart a zober €200.", 0),
    ("Demo vyšlo. Zober €150.", 150),
    ("Pokuta od deploy polície. Zaplať €50.", -50),
    ("Choď rovno do väzenia. Štart obídeš.", -9999),
    ("Choď späť o 3 políčka. Klasická cursed karta.", -3),
    ("Konzultačná faktúra zaplatená. Zober €100.", 100),
)
CHEST_CARDS: tuple[tuple[str, int | None], ...] = (
    ("Staré cloud kredity sa vrátili. Zober €100.", 100),
    ("Prekvapenie zo server billu. Zaplať €100.", -100),
    ("Narodeninový cash od banky. Zober €50.", 50),
    ("Urgentný maintenance. Zaplať €50.", -50),
    ("Dostaň sa z väzenia free-ish. Získaš rate-limit pass.", None),
    ("Bug bounty. Zober €200.", 200),
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
    mortgaged: dict[int, bool] = field(default_factory=dict)
    last_roll: tuple[int, int] | None = None
    doubles_in_row: int = 0
    pending_space: int | None = None
    auction: dict | None = None
    debt: dict | None = None
    free_parking_pot: int = 0
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
    state.history.append({"version": 0, "type": "start", "message": f"Panda Capital štartuje: {', '.join(clean_names)}. {clean_names[0]} ide prvý."})
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


def next_auction_player(state: GameState, current: Player) -> Player | None:
    if not state.auction:
        return None
    active = [p for p in state.players if p in state.auction.get("active", []) and state.player_state[p].active]
    if not active:
        return None
    start = state.players.index(current) if current in state.players else -1
    for step in range(1, len(state.players) + 1):
        candidate = state.players[(start + step) % len(state.players)]
        if candidate in active:
            return candidate
    return active[0]


def start_auction(state: GameState, space_id: int, after_turn: Player) -> None:
    space = BOARD[space_id]
    bidders = [p for p in active_players(state) if state.player_state[p].cash > 0]
    state.auction = {"spaceId": space_id, "currentBid": 0, "highBidder": None, "active": bidders, "afterTurn": after_turn}
    state.pending_space = space_id
    state.phase = "auction"
    state.turn = bidders[0] if bidders else after_turn
    state.history.append(event(state, "auction", after_turn, f"Dražba začína: {space.name}. Banka čaká na chaos."))
    if not bidders:
        close_auction(state)


def auction_bid_options(state: GameState, player: Player) -> list[int]:
    if not state.auction:
        return []
    current = int(state.auction.get("currentBid") or 0)
    cash = state.player_state[player].cash
    minimum = current + (10 if current < 100 else 25)
    options = []
    for amount in (minimum, current + 50, current + 100):
        if amount > current and amount <= cash and amount not in options:
            options.append(amount)
    return sorted(options)


def close_auction(state: GameState) -> None:
    if not state.auction:
        return
    space_id = int(state.auction["spaceId"])
    space = BOARD[space_id]
    winner = state.auction.get("highBidder")
    bid = int(state.auction.get("currentBid") or 0)
    after_turn = state.auction.get("afterTurn") or state.turn
    if winner and bid > 0:
        state.player_state[winner].cash -= bid
        state.owners[space_id] = winner
        state.history.append(event(state, "auction_win", winner, f"{state.names[winner]} vyhral dražbu {space.name} za €{bid}."))
        check_bankruptcy_and_winner(state, winner)
    else:
        state.history.append(event(state, "auction", after_turn, f"Dražba {space.name} skončila bez kupca. Banka si ho nechala."))
    state.auction = None
    state.pending_space = None
    state.turn = after_turn
    state.phase = "end" if state.phase != "finished" else "finished"


def has_buildings_in_color(state: GameState, color: str | None) -> bool:
    return any(state.buildings.get(i, 0) > 0 for i in color_spaces(color))


def can_transfer_property(state: GameState, space_id: int) -> bool:
    if not 0 <= space_id < len(BOARD):
        return False
    space = BOARD[space_id]
    if state.buildings.get(space_id, 0) > 0:
        return False
    if space.kind == "property" and has_buildings_in_color(state, space.color):
        return False
    return True


def color_spaces(color: str | None) -> list[int]:
    return [s.id for s in BOARD if s.kind == "property" and s.color == color]


def owns_color_set(state: GameState, player: Player, color: str | None) -> bool:
    spaces = color_spaces(color)
    return bool(spaces) and all(state.owners.get(i) == player for i in spaces)


def mortgage_value(space: Space) -> int:
    return space.price // 2


def unmortgage_cost(space: Space) -> int:
    return mortgage_value(space) + max(1, space.price // 10)


def can_mortgage(state: GameState, player: Player, space_id: int) -> bool:
    if not 0 <= space_id < len(BOARD):
        return False
    space = BOARD[space_id]
    if space.kind not in BUYABLE or state.owners.get(space_id) != player or state.mortgaged.get(space_id):
        return False
    if space.kind == "property" and any(state.buildings.get(i, 0) > 0 for i in color_spaces(space.color)):
        return False
    return True


def can_unmortgage(state: GameState, player: Player, space_id: int) -> bool:
    if not 0 <= space_id < len(BOARD):
        return False
    space = BOARD[space_id]
    return space.kind in BUYABLE and state.owners.get(space_id) == player and state.mortgaged.get(space_id, False) and state.player_state[player].cash >= unmortgage_cost(space)


def can_build_on(state: GameState, player: Player, space_id: int) -> bool:
    if not 0 <= space_id < len(BOARD):
        return False
    space = BOARD[space_id]
    if space.kind != "property" or state.owners.get(space_id) != player or state.mortgaged.get(space_id) or not owns_color_set(state, player, space.color):
        return False
    if any(state.mortgaged.get(i) for i in color_spaces(space.color)):
        return False
    if state.buildings.get(space_id, 0) >= 5 or state.player_state[player].cash < space.house_cost:
        return False
    group = color_spaces(space.color)
    mine = [state.buildings.get(i, 0) for i in group]
    return state.buildings.get(space_id, 0) <= min(mine)  # build evenly


def can_sell_building(state: GameState, player: Player, space_id: int) -> bool:
    if not 0 <= space_id < len(BOARD):
        return False
    space = BOARD[space_id]
    if space.kind != "property" or state.owners.get(space_id) != player or state.buildings.get(space_id, 0) <= 0:
        return False
    group = color_spaces(space.color)
    mine = [state.buildings.get(i, 0) for i in group]
    return state.buildings.get(space_id, 0) >= max(mine)  # sell evenly in reverse


def add_to_free_parking(state: GameState, amount: int) -> None:
    if amount > 0:
        state.free_parking_pot += amount


def enter_debt_if_needed(state: GameState, player: Player, creditor: Player | None = None, reason: str = "debt") -> bool:
    ps = state.player_state[player]
    if ps.active and ps.cash < 0:
        state.debt = {"player": player, "amount": -ps.cash, "creditor": creditor, "reason": reason}
        state.turn = player
        state.phase = "debt"
        state.pending_space = None
        state.history.append(event(state, "debt", player, f"{state.names[player]} je v mínuse €{-ps.cash}. Musí zohnať cash alebo zbankrotovať."))
        return True
    return False


def resolve_debt_if_possible(state: GameState, player: Player) -> None:
    if state.debt and state.debt.get("player") == player and state.player_state[player].cash >= 0:
        state.history.append(event(state, "debt_resolved", player, f"{state.names[player]} vyriešil dlh. Bankár nejasne prikyvuje."))
        state.debt = None
        state.phase = "end"


def declare_bankruptcy(state: GameState, player: Player) -> None:
    creditor = state.debt.get("creditor") if state.debt else None
    creditor = creditor if creditor in state.players and state.player_state[creditor].active else None
    ps = state.player_state[player]
    liquidation_cash = max(0, ps.cash)
    transferred: list[str] = []
    for sid, owner in list(state.owners.items()):
        if owner != player:
            continue
        space = BOARD[sid]
        liquidation_cash += state.buildings.get(sid, 0) * (space.house_cost // 2)
        state.buildings.pop(sid, None)
        if creditor:
            state.owners[sid] = creditor
            transferred.append(space.name)
        else:
            del state.owners[sid]
            state.mortgaged.pop(sid, None)
    if creditor:
        state.player_state[creditor].cash += liquidation_cash
        state.history.append(event(state, "bankrupt", player, f"{state.names[player]} bankrotuje voči {state.names[creditor]}. Majetok ide creditorovi: {', '.join(transferred) or 'nič'}."))
    else:
        state.history.append(event(state, "bankrupt", player, f"{state.names[player]} bankrotuje voči banke. Majetok sa vracia banke."))
    ps.cash = 0
    ps.active = False
    state.debt = None
    state.pending_space = None
    state.auction = None
    state.phase = "end"
    active = active_players(state)
    if len(active) == 1:
        state.winner = active[0]
        state.phase = "finished"
        state.history.append(event(state, "finish", active[0], f"{state.names[active[0]]} je posledný kapitalista na nohách."))
    elif creditor and state.player_state[creditor].active:
        state.turn = creditor
    else:
        state.turn = next_player(state, player)



def legal_actions(state: GameState, player: Player) -> list[dict]:
    if state.phase == "finished" or player != state.turn or not state.player_state.get(player, PlayerState(active=False)).active:
        return []
    ps = state.player_state[player]
    if state.phase == "debt" and state.debt and state.debt.get("player") == player:
        actions = []
        if ps.cash >= 0:
            actions.append({"type": "resolve_debt", "label": "Dlh vyriešený — pokračovať"})
        else:
            actions.append({"type": "declare_bankruptcy", "label": "Vyhlásiť bankrot"})
        if len(active_players(state)) > 1:
            actions.insert(0, {"type": "trade", "label": "Zohnať cash cez trade"})
        for i in range(len(BOARD)):
            if can_sell_building(state, player, i):
                b = state.buildings.get(i, 0)
                actions.insert(0, {"type": "sell_building", "spaceId": i, "label": f"Predať {'hotel' if b == 5 else 'dom'} na {BOARD[i].name} za €{BOARD[i].house_cost // 2}"})
            if can_mortgage(state, player, i):
                actions.insert(0, {"type": "mortgage", "spaceId": i, "label": f"Založiť {BOARD[i].name} za €{mortgage_value(BOARD[i])}"})
        return actions
    if state.phase == "roll":
        actions = [{"type": "roll", "label": "Hodiť kockami"}]
        if ps.jail_turns > 0:
            if ps.cash >= 50:
                actions.insert(0, {"type": "pay_jail", "label": "Zaplať €50 a vypadni z väzenia"})
            if ps.jail_cards > 0:
                actions.insert(0, {"type": "use_jail_card", "label": "Použi rate-limit pass"})
        return actions
    if state.phase == "buy" and state.pending_space is not None:
        space = BOARD[state.pending_space]
        actions = [{"type": "skip_buy", "spaceId": space.id, "label": f"Dražiť {space.name} namiesto kúpy"}]
        if ps.cash >= space.price:
            actions.insert(0, {"type": "buy", "spaceId": space.id, "label": f"Kúpiť {space.name} za €{space.price}"})
        return actions
    if state.phase == "auction" and state.auction:
        space = BOARD[int(state.auction["spaceId"])]
        actions = [{"type": "pass_auction", "spaceId": space.id, "label": f"Pass v dražbe {space.name}"}]
        for amount in auction_bid_options(state, player):
            actions.insert(0, {"type": "bid_auction", "spaceId": space.id, "amount": amount, "label": f"Bid €{amount} za {space.name}"})
        return actions
    if state.phase == "end":
        actions = [{"type": "end_turn", "label": "Ukončiť ťah"}]
        if len(active_players(state)) > 1:
            actions.insert(0, {"type": "trade", "label": "Trade / transfer desk"})
        for i in range(len(BOARD)):
            if can_sell_building(state, player, i):
                b = state.buildings.get(i, 0)
                actions.insert(0, {"type": "sell_building", "spaceId": i, "label": f"Predať {'hotel' if b == 5 else 'dom'} na {BOARD[i].name} za €{BOARD[i].house_cost // 2}"})
            if can_unmortgage(state, player, i):
                actions.insert(0, {"type": "unmortgage", "spaceId": i, "label": f"Odkúpiť späť {BOARD[i].name} za €{unmortgage_cost(BOARD[i])}"})
            if can_mortgage(state, player, i):
                actions.insert(0, {"type": "mortgage", "spaceId": i, "label": f"Založiť {BOARD[i].name} za €{mortgage_value(BOARD[i])}"})
            if can_build_on(state, player, i):
                b = state.buildings.get(i, 0)
                actions.insert(0, {"type": "build", "spaceId": i, "label": f"Postaviť {'hotel' if b == 4 else 'dom'} na {BOARD[i].name} (€{BOARD[i].house_cost})"})
        return actions
    return []


def rent_for(state: GameState, space: Space, roll_total: int | None = None) -> int:
    owner = state.owners.get(space.id)
    if state.mortgaged.get(space.id):
        return 0
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
    assets = sum((mortgage_value(BOARD[i]) if state.mortgaged.get(i) else BOARD[i].price) for i, owner in state.owners.items() if owner == player)
    houses = sum(state.buildings.get(i, 0) * (BOARD[i].house_cost // 2) for i, owner in state.owners.items() if owner == player)
    return ps.cash + assets + houses


def apply_action(state: GameState, player: Player, action: dict, *, seed: int | None = None) -> GameState:
    action_type = action.get("type")
    allowed = legal_actions(state, player)
    matched = False
    for candidate in allowed:
        if candidate["type"] != action_type:
            continue
        if candidate["type"] in {"build", "sell_building", "mortgage", "unmortgage"} and action.get("spaceId") != candidate.get("spaceId"):
            continue
        if candidate["type"] == "bid_auction" and action.get("amount") != candidate.get("amount"):
            continue
        matched = True
        break
    if not matched:
        raise IllegalAction(f"Illegal action {action_type}")
    rng = random.Random(seed) if seed is not None else random.SystemRandom()  # type: ignore[assignment]

    if action_type == "pay_jail":
        ps = state.player_state[player]
        ps.cash -= 50
        add_to_free_parking(state, 50)
        ps.jail_turns = 0
        state.history.append(event(state, "jail", player, f"{state.names[player]} zaplatil €50 a odišiel z väzenia."))
        check_bankruptcy_and_winner(state, player)
        return bump(state)

    if action_type == "use_jail_card":
        ps = state.player_state[player]
        ps.jail_cards -= 1
        ps.jail_turns = 0
        state.history.append(event(state, "jail_card", player, f"{state.names[player]} použil rate-limit pass a odišiel z väzenia."))
        return bump(state)

    if action_type == "resolve_debt":
        if not state.debt or state.debt.get("player") != player or state.player_state[player].cash < 0:
            raise IllegalAction("Debt is not resolved")
        resolve_debt_if_possible(state, player)
        return bump(state)

    if action_type == "declare_bankruptcy":
        declare_bankruptcy(state, player)
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
                state.history.append(event(state, "jail", player, f"{state.names[player]} hodil doubles {d1}+{d2} a ušiel z väzenia."))
                move_and_resolve(state, player, roll_total, rng)
            else:
                ps.jail_turns -= 1
                state.history.append(event(state, "jail", player, f"{state.names[player]} nehodil doubles ({d1}+{d2}) a ostáva vo väzení."))
                if ps.jail_turns <= 0 and ps.cash >= 50:
                    ps.cash -= 50
                    add_to_free_parking(state, 50)
                    state.history.append(event(state, "jail", player, f"Tretí neúspešný pokus: platí €50 a ďalší ťah ide von."))
                state.phase = "end"
            return bump(state)

        if d1 == d2:
            state.doubles_in_row += 1
            if state.doubles_in_row >= 3:
                send_to_jail(state, player, "hodil tri doubles a dostal rate-limit do väzenia")
                return bump(state)
        else:
            state.doubles_in_row = 0
        state.history.append(event(state, "roll", player, f"{state.names[player]} hodil {d1}+{d2}."))
        move_and_resolve(state, player, roll_total, rng)
        return bump(state)

    if action_type == "buy":
        space = BOARD[state.pending_space or 0]
        state.player_state[player].cash -= space.price
        state.owners[space.id] = player
        state.pending_space = None
        state.phase = "end"
        state.history.append(event(state, "buy", player, f"{state.names[player]} kúpil {space.name} za €{space.price}."))
        check_bankruptcy_and_winner(state, player)
        return bump(state)

    if action_type == "skip_buy":
        space = BOARD[state.pending_space or 0]
        state.history.append(event(state, "skip_buy", player, f"{state.names[player]} nekúpil {space.name}. Ide do dražby."))
        start_auction(state, space.id, player)
        return bump(state)

    if action_type == "bid_auction":
        if not state.auction:
            raise IllegalAction("No auction running")
        amount = int(action.get("amount"))
        state.auction["currentBid"] = amount
        state.auction["highBidder"] = player
        space = BOARD[int(state.auction["spaceId"])]
        state.history.append(event(state, "auction_bid", player, f"{state.names[player]} biduje €{amount} za {space.name}."))
        nxt = next_auction_player(state, player)
        if nxt is None:
            close_auction(state)
        else:
            state.turn = nxt
        return bump(state)

    if action_type == "pass_auction":
        if not state.auction:
            raise IllegalAction("No auction running")
        active = [p for p in state.auction.get("active", []) if p != player]
        state.auction["active"] = active
        space = BOARD[int(state.auction["spaceId"])]
        state.history.append(event(state, "auction_pass", player, f"{state.names[player]} passol dražbu {space.name}."))
        high = state.auction.get("highBidder")
        if not active or (high and set(active) <= {high}):
            close_auction(state)
        else:
            nxt = next_auction_player(state, player)
            state.turn = nxt or active[0]
        return bump(state)

    if action_type == "sell_building":
        space_id = int(action.get("spaceId"))
        space = BOARD[space_id]
        state.buildings[space_id] = max(0, state.buildings.get(space_id, 0) - 1)
        if state.buildings[space_id] == 0:
            state.buildings.pop(space_id, None)
        refund = space.house_cost // 2
        state.player_state[player].cash += refund
        state.history.append(event(state, "sell_building", player, f"{state.names[player]} predal building na {space.name} za €{refund}."))
        resolve_debt_if_possible(state, player)
        return bump(state)

    if action_type == "trade":
        if state.phase not in {"end", "debt"}:
            raise IllegalAction("Trades only at end/debt phase")
        other = action.get("toPlayer")
        if other not in state.players or other == player or not state.player_state[other].active:
            raise IllegalAction("Bad trade partner")
        cash_from = max(0, int(action.get("cashFrom") or 0))
        cash_to = max(0, int(action.get("cashTo") or 0))
        props_from = [int(i) for i in action.get("propertiesFrom") or []]
        props_to = [int(i) for i in action.get("propertiesTo") or []]
        if state.player_state[player].cash < cash_from or state.player_state[other].cash < cash_to:
            raise IllegalAction("Not enough cash for trade")
        for sid in props_from:
            if state.owners.get(sid) != player or not can_transfer_property(state, sid):
                raise IllegalAction("Cannot trade one of your properties")
        for sid in props_to:
            if state.owners.get(sid) != other or not can_transfer_property(state, sid):
                raise IllegalAction("Cannot trade one of partner properties")
        if cash_from == cash_to == 0 and not props_from and not props_to:
            raise IllegalAction("Empty trade")
        state.player_state[player].cash -= cash_from
        state.player_state[other].cash += cash_from
        state.player_state[other].cash -= cash_to
        state.player_state[player].cash += cash_to
        for sid in props_from:
            state.owners[sid] = other
        for sid in props_to:
            state.owners[sid] = player
        left = ", ".join(BOARD[i].name for i in props_from) or "nič"
        right = ", ".join(BOARD[i].name for i in props_to) or "nič"
        state.history.append(event(state, "trade", player, f"Trade: {state.names[player]} dal {left} + €{cash_from}; {state.names[other]} dal {right} + €{cash_to}."))
        resolve_debt_if_possible(state, player)
        check_bankruptcy_and_winner(state, other)
        return bump(state)

    if action_type == "mortgage":
        space_id = int(action.get("spaceId"))
        space = BOARD[space_id]
        state.mortgaged[space_id] = True
        state.player_state[player].cash += mortgage_value(space)
        state.history.append(event(state, "mortgage", player, f"{state.names[player]} založil {space.name} a získal €{mortgage_value(space)}. Nájom je vypnutý."))
        resolve_debt_if_possible(state, player)
        return bump(state)

    if action_type == "unmortgage":
        space_id = int(action.get("spaceId"))
        space = BOARD[space_id]
        cost = unmortgage_cost(space)
        state.player_state[player].cash -= cost
        state.mortgaged.pop(space_id, None)
        state.history.append(event(state, "unmortgage", player, f"{state.names[player]} odkúpil späť {space.name} za €{cost}. Nájom znovu beží."))
        check_bankruptcy_and_winner(state, player)
        return bump(state)

    if action_type == "build":
        space_id = int(action.get("spaceId"))
        space = BOARD[space_id]
        state.player_state[player].cash -= space.house_cost
        state.buildings[space_id] = state.buildings.get(space_id, 0) + 1
        b = state.buildings[space_id]
        state.history.append(event(state, "build", player, f"{state.names[player]} built {'a hotel' if b == 5 else f'house {b}'} on {space.name} za €{space.house_cost}."))
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
        state.history.append(event(state, "go", player, f"{state.names[player]} prešiel Štartom a zobral €{GO_MONEY}."))
    space = BOARD[new]
    state.history.append(event(state, "land", player, f"{state.names[player]} prišiel na {space.name}."))
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
        state.history.append(event(state, "rent", player, f"Nájom: {state.names[player]} platí €{rent} pre {state.names[owner]}."))
        enter_debt_if_needed(state, player, owner, "rent")
    elif space.kind == "tax":
        ps.cash -= space.rent
        add_to_free_parking(state, space.rent)
        state.history.append(event(state, "tax", player, f"{state.names[player]} platí €{space.rent} do Free Parking potu za {space.name}."))
        enter_debt_if_needed(state, player, None, "tax")
    elif space.kind == "chance":
        draw_card(state, player, rng.choice(CHANCE_CARDS), rng)
    elif space.kind == "chest":
        draw_card(state, player, rng.choice(CHEST_CARDS), rng)
    elif space.kind == "go_to_jail":
        send_to_jail(state, player, "was sent directly pre Jail")
        return
    elif space.kind == "free_parking":
        pot = state.free_parking_pot
        if pot > 0:
            ps.cash += pot
            state.free_parking_pot = 0
            state.history.append(event(state, "free_parking", player, f"{state.names[player]} berie Free Parking pot €{pot}. Gauč capitalism."))
        else:
            state.history.append(event(state, "free_parking", player, f"{state.names[player]} si dáva gauč pauzu na Free Parking."))
    elif space.kind == "jail":
        state.history.append(event(state, "visit_jail", player, f"{state.names[player]} je vo väzení len na návšteve. Extrémne legálne."))
    if state.phase != "debt":
        check_bankruptcy_and_winner(state, player)
        state.phase = "end" if state.phase != "finished" else "finished"


def draw_card(state: GameState, player: Player, card: tuple[str, int | None], rng: random.Random) -> None:
    message, effect = card
    ps = state.player_state[player]
    state.history.append(event(state, "card", player, f"Karta: {message}"))
    if effect is None:
        ps.jail_cards += 1
    elif effect == 0:
        ps.position = 0
        ps.cash += GO_MONEY
    elif effect == -9999:
        send_to_jail(state, player, "drew a card sending them pre Jail")
    elif effect == -3:
        ps.position = (ps.position - 3) % len(BOARD)
        resolve_landing(state, player, BOARD[ps.position], 3, rng)
    else:
        delta = int(effect)
        ps.cash += delta
        if delta < 0:
            add_to_free_parking(state, -delta)
            enter_debt_if_needed(state, player, None, "card")


def send_to_jail(state: GameState, player: Player, reason: str) -> None:
    ps = state.player_state[player]
    ps.position = 10
    ps.jail_turns = 3
    state.doubles_in_row = 0
    state.pending_space = None
    state.phase = "end"
    state.history.append(event(state, "go_to_jail", player, f"{state.names[player]} {reason}."))


def check_bankruptcy_and_winner(state: GameState, debtor: Player | None = None, creditor: Player | None = None) -> None:
    if state.phase == "finished":
        return
    if debtor and state.player_state[debtor].cash < 0:
        enter_debt_if_needed(state, debtor, creditor, "debt")
        return
    for p in list(active_players(state)):
        if state.player_state[p].cash < 0:
            enter_debt_if_needed(state, p, None, "debt")
            return
    active = active_players(state)
    if len(active) == 1:
        state.winner = active[0]
        state.phase = "finished"
        state.history.append(event(state, "finish", active[0], f"{state.names[active[0]]} je posledný kapitalista na nohách."))


def finish_or_advance(state: GameState, player: Player, *, extra_turn: bool = False) -> None:
    check_bankruptcy_and_winner(state, player)
    if state.phase in {"debt", "finished"}:
        return
    if extra_turn and state.player_state[player].jail_turns == 0:
        state.phase = "roll"
        state.history.append(event(state, "extra_turn", player, f"{state.names[player]} hodil doubles and goes again."))
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
