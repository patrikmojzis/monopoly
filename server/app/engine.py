from __future__ import annotations

from dataclasses import dataclass, field
import random
from typing import Literal

Player = Literal["p1", "p2"]
ActionType = Literal["roll", "buy", "skip_buy", "end_turn", "new_game"]

GO_MONEY = 200
START_CASH = 1500
WIN_NET_WORTH = 2500


class IllegalAction(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class Space:
    id: int
    name: str
    kind: Literal["go", "property", "tax", "chance", "chest", "jail", "railroad", "utility"]
    price: int = 0
    rent: int = 0
    color: str | None = None


BOARD: tuple[Space, ...] = (
    Space(0, "GO / Deploy Bonus", "go"),
    Space(1, "Prompt Alley", "property", 60, 2, "brown"),
    Space(2, "Chaos Card", "chest"),
    Space(3, "Token Street", "property", 60, 4, "brown"),
    Space(4, "Cloud Bill", "tax"),
    Space(5, "GPU Express", "railroad", 200, 25, "railroad"),
    Space(6, "Vector Lane", "property", 100, 6, "light-blue"),
    Space(7, "Incident Card", "chance"),
    Space(8, "Webhook Wharf", "property", 100, 6, "light-blue"),
    Space(9, "SQLite Square", "property", 120, 8, "light-blue"),
    Space(10, "Jail / Rate Limited", "jail"),
    Space(11, "Docker Drive", "property", 140, 10, "pink"),
    Space(12, "Electric LLM Utility", "utility", 150, 0, "utility"),
    Space(13, "Telepathy Terrace", "property", 140, 10, "pink"),
    Space(14, "Calendar Court", "property", 160, 12, "pink"),
    Space(15, "Cron Rail", "railroad", 200, 25, "railroad"),
    Space(16, "Bugfix Boulevard", "property", 180, 14, "orange"),
    Space(17, "Chaos Card", "chest"),
    Space(18, "Agent Avenue", "property", 180, 14, "orange"),
    Space(19, "Panda HQ", "property", 200, 16, "orange"),
)
BUYABLE = {"property", "railroad", "utility"}

CARDS: tuple[tuple[int, str], ...] = (
    (150, "Emergency demo somehow worked. Collect €150."),
    (100, "Client says 'this is exactly what we need'. Collect €100."),
    (50, "Found money in old cloud credits. Collect €50."),
    (-50, "You bought another domain at 2am. Pay €50."),
    (-100, "Production monitor screamed. Pay €100 in emotional damages."),
    (-150, "Scope creep arrived wearing a fake moustache. Pay €150."),
)


@dataclass(slots=True)
class PlayerState:
    cash: int = START_CASH
    position: int = 0
    jail_turns: int = 0


@dataclass(slots=True)
class GameState:
    id: str
    players: list[Player]
    names: dict[Player, str]
    turn: Player
    phase: Literal["roll", "buy", "end", "finished"] = "roll"
    player_state: dict[Player, PlayerState] = field(default_factory=dict)
    owners: dict[int, Player] = field(default_factory=dict)
    last_roll: tuple[int, int] | None = None
    pending_space: int | None = None
    winner: Player | None = None
    version: int = 0
    tokens: dict[str, str] = field(default_factory=dict)
    history: list[dict] = field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


def other(player: Player) -> Player:
    return "p2" if player == "p1" else "p1"


def initial_state(game_id: str, *, tokens: dict[str, str] | None = None, seed: int | None = None) -> GameState:
    state = GameState(
        id=game_id,
        players=["p1", "p2"],
        names={"p1": "Patrik", "p2": "Clawd"},
        turn="p1",
        player_state={"p1": PlayerState(), "p2": PlayerState()},
        tokens=tokens or {},
    )
    state.history.append({"version": 0, "type": "start", "message": "Game started. Patrik moves first."})
    return state


def owned_set_multiplier(state: GameState, owner: Player, space: Space) -> int:
    if not space.color or space.kind not in BUYABLE:
        return 1
    color_spaces = [s.id for s in BOARD if s.color == space.color and s.kind == space.kind]
    if color_spaces and all(state.owners.get(space_id) == owner for space_id in color_spaces):
        return 2
    return 1


def rent_for(state: GameState, space: Space, roll_total: int | None = None) -> int:
    owner = state.owners.get(space.id)
    if not owner:
        return 0
    if space.kind == "utility":
        return (roll_total or 7) * 4
    if space.kind == "railroad":
        count = sum(1 for s in BOARD if s.kind == "railroad" and state.owners.get(s.id) == owner)
        return 25 * (2 ** (count - 1))
    return space.rent * owned_set_multiplier(state, owner, space)


def net_worth(state: GameState, player: Player) -> int:
    cash = state.player_state[player].cash
    assets = sum(BOARD[space_id].price for space_id, owner in state.owners.items() if owner == player)
    return cash + assets


def legal_actions(state: GameState, player: Player) -> list[dict]:
    if state.phase == "finished" or player != state.turn:
        return []
    if state.phase == "roll":
        return [{"type": "roll"}]
    if state.phase == "buy" and state.pending_space is not None:
        space = BOARD[state.pending_space]
        actions = [{"type": "skip_buy"}]
        if state.player_state[player].cash >= space.price:
            actions.insert(0, {"type": "buy"})
        return actions
    if state.phase == "end":
        return [{"type": "end_turn"}]
    return []


def apply_action(state: GameState, player: Player, action: dict, *, seed: int | None = None) -> GameState:
    action_type = action.get("type")
    if not any(a["type"] == action_type for a in legal_actions(state, player)):
        raise IllegalAction(f"Illegal action {action_type}")
    rng = random.Random(seed) if seed is not None else random.SystemRandom()  # type: ignore[assignment]

    if action_type == "roll":
        ps = state.player_state[player]
        if ps.jail_turns > 0:
            ps.cash -= 50
            ps.jail_turns -= 1
            state.history.append({"type": "jail", "player": player, "message": f"{state.names[player]} paid €50 and loses this turn."})
            state.phase = "end"
            return bump(state)
        d1, d2 = rng.randint(1, 6), rng.randint(1, 6)
        total = d1 + d2
        old = ps.position
        new = (old + total) % len(BOARD)
        ps.position = new
        ps.cash += GO_MONEY if old + total >= len(BOARD) else 0
        state.last_roll = (d1, d2)
        space = BOARD[new]
        msg = f"{state.names[player]} rolled {d1}+{d2} and landed on {space.name}."
        if old + total >= len(BOARD):
            msg += " Passed GO: +€200."
        state.history.append({"type": "roll", "player": player, "roll": [d1, d2], "space": new, "message": msg})
        resolve_landing(state, player, space, total, rng)
        return bump(state)

    if action_type == "buy":
        space = BOARD[state.pending_space or 0]
        state.player_state[player].cash -= space.price
        state.owners[space.id] = player
        state.pending_space = None
        state.phase = "end"
        state.history.append({"type": "buy", "player": player, "space": space.id, "message": f"{state.names[player]} bought {space.name} for €{space.price}."})
        return bump(state)

    if action_type == "skip_buy":
        space = BOARD[state.pending_space or 0]
        state.pending_space = None
        state.phase = "end"
        state.history.append({"type": "skip_buy", "player": player, "space": space.id, "message": f"{state.names[player]} skipped {space.name}."})
        return bump(state)

    if action_type == "end_turn":
        maybe_finish(state)
        if state.phase != "finished":
            state.turn = other(player)
            state.phase = "roll"
        return bump(state)

    raise IllegalAction(f"Unknown action {action_type}")


def resolve_landing(state: GameState, player: Player, space: Space, roll_total: int, rng: random.Random) -> None:
    ps = state.player_state[player]
    owner = state.owners.get(space.id)
    if space.kind in BUYABLE and owner is None:
        state.pending_space = space.id
        state.phase = "buy"
        return
    if owner and owner != player:
        rent = rent_for(state, space, roll_total)
        ps.cash -= rent
        state.player_state[owner].cash += rent
        state.history.append({"type": "rent", "player": player, "to": owner, "amount": rent, "message": f"Rent: {state.names[player]} pays €{rent} to {state.names[owner]}."})
    elif space.kind == "tax":
        ps.cash -= 100
        state.history.append({"type": "tax", "player": player, "amount": 100, "message": f"Income Tax: {state.names[player]} pays €100."})
    elif space.kind in {"chance", "chest"}:
        amount, card_message = rng.choice(CARDS)
        ps.cash += amount
        state.history.append({"type": space.kind, "player": player, "amount": amount, "message": f"{space.name}: {card_message}"})
    elif space.kind == "jail":
        state.history.append({"type": "visit_jail", "player": player, "message": f"{state.names[player]} is just visiting rate-limit jail. Mentally relatable."})
    state.phase = "end"
    maybe_finish(state)


def maybe_finish(state: GameState) -> None:
    for p in state.players:
        if state.player_state[p].cash < 0:
            state.winner = other(p)  # type: ignore[arg-type]
            state.phase = "finished"
            state.history.append({"type": "finish", "winner": state.winner, "message": f"{state.names[p]} is bankrupt. {state.names[state.winner]} wins."})
            return
    for p in state.players:
        if net_worth(state, p) >= WIN_NET_WORTH:
            state.winner = p
            state.phase = "finished"
            state.history.append({"type": "finish", "winner": p, "message": f"{state.names[p]} reached €{WIN_NET_WORTH} net worth and wins."})
            return


def bump(state: GameState) -> GameState:
    state.version += 1
    return state
