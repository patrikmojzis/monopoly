from __future__ import annotations

import os
import secrets
import time
import uuid
from pathlib import Path
from dataclasses import asdict

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .engine import BOARD, BUYABLE, IllegalAction, apply_action, initial_state, legal_actions, mortgage_value, net_worth, rent_for, unmortgage_cost
from .storage import load_game, save_game

PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
WEB_DIST_DIR = Path(os.environ.get("WEB_DIST_DIR", "web/dist"))

app = FastAPI(title="Panda Capital")


class GameCreate(BaseModel):
    humanPlayer: str = "p1"
    playerNames: list[str] | None = None


class ActionIn(BaseModel):
    type: str
    spaceId: int | None = None
    amount: int | None = None
    toPlayer: str | None = None
    cashFrom: int | None = None
    cashTo: int | None = None
    propertiesFrom: list[int] | None = None
    propertiesTo: list[int] | None = None


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


def token_for(tokens: dict[str, str], auth: str | None) -> str:
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = auth.split(" ", 1)[1]
    for player, value in tokens.items():
        if secrets.compare_digest(token, value):
            return player
    raise HTTPException(403, "Bad token")


def links(game_id: str) -> dict:
    base = f"{PUBLIC_BASE_URL}/api/games/{game_id}"
    return {
        "self": base,
        "legalActions": f"{base}/legal-actions",
        "boardText": f"{base}/board.txt",
        "wait": f"{base}/wait",
        "action": f"{base}/actions",
    }


def public_state(state, viewer: str) -> dict:
    return {
        "id": state.id,
        "version": state.version,
        "viewer": viewer,
        "turn": state.turn,
        "phase": state.phase,
        "winner": state.winner,
        "canAct": viewer == state.turn and state.phase != "finished",
        "players": state.players,
        "names": state.names,
        "playerState": {p: {"cash": ps.cash, "position": ps.position, "jailTurns": ps.jail_turns, "jailCards": ps.jail_cards, "active": ps.active, "netWorth": net_worth(state, p)} for p, ps in state.player_state.items()},
        "owners": state.owners,
        "buildings": state.buildings,
        "mortgaged": state.mortgaged,
        "auction": state.auction,
        "debt": state.debt,
        "freeParkingPot": state.free_parking_pot,
        "lastRoll": state.last_roll,
        "doublesInRow": state.doubles_in_row,
        "pendingSpace": state.pending_space,
        "board": [asdict(space) | {"currentRent": rent_for(state, space, state.last_roll[0] + state.last_roll[1] if state.last_roll else None), "isBuyable": space.kind in BUYABLE, "mortgageValue": mortgage_value(space) if space.kind in BUYABLE else 0, "unmortgageCost": unmortgage_cost(space) if space.kind in BUYABLE else 0} for space in BOARD],
        "legalActions": legal_actions(state, viewer) if viewer in state.players else [],
        "history": state.history[-30:],
        "links": links(state.id),
    }


@app.post("/api/games")
def create_game(payload: GameCreate) -> dict:
    game_id = uuid.uuid4().hex[:12]
    names = payload.playerNames or ["Patrik", "Clawd"]
    player_count = max(2, min(4, len([n for n in names if n and n.strip()])))
    players = [f"p{i+1}" for i in range(player_count)]
    tokens = {p: secrets.token_urlsafe(24) for p in players}
    tokens["spectator"] = secrets.token_urlsafe(24)
    state = initial_state(game_id, tokens=tokens, names=names)
    save_game(state)
    player_urls = {p: f"{PUBLIC_BASE_URL}/game/{game_id}?token={t}" for p, t in tokens.items()}
    agent_configs = {p: {"gameId": game_id, "player": p, "authorization": f"Bearer {tokens[p]}", "stateUrl": links(game_id)["self"], "legalActionsUrl": links(game_id)["legalActions"], "boardTextUrl": links(game_id)["boardText"], "waitUrl": links(game_id)["wait"], "actionUrl": links(game_id)["action"]} for p in state.players}
    human = payload.humanPlayer if payload.humanPlayer in state.players else state.players[0]
    return {"gameId": game_id, "turn": state.turn, "browserUrl": player_urls[human], "spectatorUrl": player_urls["spectator"], "playerUrls": player_urls, "agentConfigs": agent_configs}


def require_game(game_id: str):
    state = load_game(game_id)
    if not state:
        raise HTTPException(404, "Game not found")
    return state


@app.get("/api/games/{game_id}")
def get_game(game_id: str, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    return public_state(state, viewer)


@app.get("/api/games/{game_id}/legal-actions")
def get_legal(game_id: str, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    return {"actions": legal_actions(state, viewer)}


@app.get("/api/games/{game_id}/board.txt", response_class=PlainTextResponse)
def board_text(game_id: str, authorization: str | None = Header(default=None)) -> str:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    rows = [f"Panda Capital {state.id} v{state.version}", f"Turn: {state.names.get(state.turn)} phase={state.phase}"]
    for p in state.players:
        ps = state.player_state[p]
        jail = f", jail={ps.jail_turns}" if ps.jail_turns else ""
        rows.append(f"{p} {state.names[p]}: cash €{ps.cash}, pos {ps.position} {BOARD[ps.position].name}, net €{net_worth(state,p)}, active={ps.active}{jail}")
    owned = ", ".join(f"{i}:{BOARD[i].name}->{state.names[o]} buildings={state.buildings.get(i,0)} rent={rent_for(state, BOARD[i])}" for i, o in sorted(state.owners.items()))
    rows.append("Owned: " + (owned or "none"))
    rows.append("Board: " + " | ".join(f"{s.id}:{s.name}({s.kind}{","+s.color if s.color else ""})" for s in BOARD))
    rows.append("Legal: " + str(legal_actions(state, viewer)))
    return "\n".join(rows)


@app.get("/api/games/{game_id}/wait")
def wait_game(game_id: str, since: int = 0, timeout: int = 25, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    deadline = time.monotonic() + max(1, min(timeout, 55))
    while state.version <= since and state.phase != "finished" and time.monotonic() < deadline:
        time.sleep(0.5)
        state = require_game(game_id)
    return public_state(state, viewer)


@app.post("/api/games/{game_id}/actions")
def post_action(game_id: str, payload: ActionIn, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    try:
        action = {"type": payload.type}
        for key in ("spaceId", "amount", "toPlayer", "cashFrom", "cashTo", "propertiesFrom", "propertiesTo"):
            value = getattr(payload, key)
            if value is not None:
                action[key] = value
        apply_action(state, viewer, action)
    except IllegalAction as exc:
        raise HTTPException(400, str(exc)) from exc
    save_game(state)
    return public_state(state, viewer)


def _bot_should_buy(state, player: str) -> bool:
    space_id = state.pending_space
    if space_id is None:
        return False
    space = BOARD[space_id]
    cash = state.player_state[player].cash
    if cash < space.price:
        return False
    if space.kind in {"railroad", "utility"}:
        return cash - space.price >= 100
    color_mates = [s.id for s in BOARD if s.color == space.color and s.kind == space.kind and s.id != space.id]
    if color_mates and any(state.owners.get(i) == player for i in color_mates):
        return cash - space.price >= 50
    return cash - space.price >= 250


def _bot_build_action(state, player: str) -> dict | None:
    actions = legal_actions(state, player)
    builds = [a for a in actions if a["type"] == "build"]
    if not builds:
        return None
    return sorted(builds, key=lambda a: BOARD[a["spaceId"]].price, reverse=True)[0]


def _bot_auction_action(state, player: str) -> dict:
    actions = legal_actions(state, player)
    bids = [a for a in actions if a["type"] == "bid_auction"]
    if not bids:
        return {"type": "pass_auction"}
    space = BOARD[int(state.auction["spaceId"])] if state.auction else None
    cash = state.player_state[player].cash
    owns_mate = bool(space and any(s.kind == space.kind and s.color == space.color and state.owners.get(s.id) == player for s in BOARD if s.id != space.id))
    max_price = int((space.price if space else 100) * (1.15 if owns_mate else 0.75))
    affordable = [a for a in bids if int(a.get("amount", 999999)) <= max_price and cash - int(a.get("amount", 0)) >= 80]
    return affordable[0] if affordable else {"type": "pass_auction"}


@app.post("/api/games/{game_id}/bot-turn")
def bot_turn(game_id: str, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    if viewer not in set(state.players) | {"spectator"}:
        raise HTTPException(403, "Bad viewer")
    bot_player = state.turn
    if bot_player == "p1" or state.phase == "finished":
        return public_state(state, viewer)
    steps = 0
    while state.turn == bot_player and state.phase != "finished" and steps < 12:
        steps += 1
        if state.phase == "roll":
            apply_action(state, bot_player, {"type": "roll"})
        elif state.phase == "buy":
            apply_action(state, bot_player, {"type": "buy" if _bot_should_buy(state, bot_player) else "skip_buy"})
        elif state.phase == "auction":
            apply_action(state, bot_player, _bot_auction_action(state, bot_player))
        elif state.phase == "end":
            build = _bot_build_action(state, bot_player)
            if build and state.player_state[bot_player].cash > 500:
                apply_action(state, bot_player, build)
            else:
                apply_action(state, bot_player, {"type": "end_turn"})
    save_game(state)
    return public_state(state, viewer)


@app.post("/api/games/{game_id}/clawd-turn")
def clawd_turn(game_id: str, authorization: str | None = Header(default=None)) -> dict:
    return bot_turn(game_id, authorization)


if WEB_DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=WEB_DIST_DIR / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str):
    # Serve Vite public-root assets such as /panda-capital-key-art.png, then fall back to SPA index.
    requested = (WEB_DIST_DIR / full_path).resolve()
    dist_root = WEB_DIST_DIR.resolve()
    if full_path and requested.is_file() and str(requested).startswith(str(dist_root)):
        return FileResponse(requested)
    index = WEB_DIST_DIR / "index.html"
    if index.exists():
        return FileResponse(index)
    raise HTTPException(404, "Frontend not built")
