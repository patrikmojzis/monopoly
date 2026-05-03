from __future__ import annotations

import os
import secrets
import uuid
from pathlib import Path
from dataclasses import asdict

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .engine import BOARD, IllegalAction, apply_action, initial_state, legal_actions, net_worth
from .storage import load_game, save_game

PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
WEB_DIST_DIR = Path(os.environ.get("WEB_DIST_DIR", "web/dist"))

app = FastAPI(title="Monopoly Lite")


class GameCreate(BaseModel):
    humanPlayer: str = "p1"


class ActionIn(BaseModel):
    type: str


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
        "playerState": {p: {"cash": ps.cash, "position": ps.position, "jailTurns": ps.jail_turns, "netWorth": net_worth(state, p)} for p, ps in state.player_state.items()},
        "owners": state.owners,
        "lastRoll": state.last_roll,
        "pendingSpace": state.pending_space,
        "board": [asdict(space) for space in BOARD],
        "legalActions": legal_actions(state, viewer) if viewer in state.players else [],
        "history": state.history[-30:],
        "links": links(state.id),
    }


@app.post("/api/games")
def create_game(payload: GameCreate) -> dict:
    game_id = uuid.uuid4().hex[:12]
    tokens = {"p1": secrets.token_urlsafe(24), "p2": secrets.token_urlsafe(24), "spectator": secrets.token_urlsafe(24)}
    state = initial_state(game_id, tokens=tokens)
    save_game(state)
    player_urls = {p: f"{PUBLIC_BASE_URL}/game/{game_id}?token={t}" for p, t in tokens.items()}
    agent_configs = {p: {"gameId": game_id, "player": p, "authorization": f"Bearer {tokens[p]}", "stateUrl": links(game_id)["self"], "legalActionsUrl": links(game_id)["legalActions"], "boardTextUrl": links(game_id)["boardText"], "waitUrl": links(game_id)["wait"], "actionUrl": links(game_id)["action"]} for p in ["p1", "p2"]}
    return {"gameId": game_id, "turn": state.turn, "browserUrl": player_urls[payload.humanPlayer], "spectatorUrl": player_urls["spectator"], "playerUrls": player_urls, "agentConfigs": agent_configs}


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
    rows = [f"Monopoly Lite {state.id} v{state.version}", f"Turn: {state.names.get(state.turn)} phase={state.phase}"]
    for p in state.players:
        ps = state.player_state[p]
        rows.append(f"{state.names[p]}: cash €{ps.cash}, pos {ps.position} {BOARD[ps.position].name}, net €{net_worth(state,p)}")
    rows.append("Owned: " + ", ".join(f"{BOARD[i].name}->{state.names[o]}" for i, o in state.owners.items()) or "none")
    rows.append("Legal: " + str(legal_actions(state, viewer)))
    return "\n".join(rows)


@app.get("/api/games/{game_id}/wait")
def wait_game(game_id: str, since: int = 0, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    return public_state(state, viewer)


@app.post("/api/games/{game_id}/actions")
def post_action(game_id: str, payload: ActionIn, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    try:
        apply_action(state, viewer, {"type": payload.type})
    except IllegalAction as exc:
        raise HTTPException(400, str(exc)) from exc
    save_game(state)
    return public_state(state, viewer)


def _clawd_should_buy(state) -> bool:
    space_id = state.pending_space
    if space_id is None:
        return False
    space = BOARD[space_id]
    cash = state.player_state["p2"].cash
    if cash < space.price:
        return False
    # Clawd is aggressive on railroads/utilities and set-completion, otherwise keeps a small buffer.
    if space.kind in {"railroad", "utility"}:
        return cash - space.price >= 100
    color_mates = [s.id for s in BOARD if s.color == space.color and s.kind == space.kind and s.id != space.id]
    if color_mates and any(state.owners.get(i) == "p2" for i in color_mates):
        return cash - space.price >= 50
    return cash - space.price >= 250


@app.post("/api/games/{game_id}/clawd-turn")
def clawd_turn(game_id: str, authorization: str | None = Header(default=None)) -> dict:
    state = require_game(game_id)
    viewer = token_for(state.tokens, authorization)
    if viewer not in {"p1", "spectator"}:
        raise HTTPException(403, "Only the human/spectator side can ask Clawd to move")
    steps = 0
    while state.turn == "p2" and state.phase != "finished" and steps < 8:
        steps += 1
        if state.phase == "roll":
            apply_action(state, "p2", {"type": "roll"})
        elif state.phase == "buy":
            if _clawd_should_buy(state):
                apply_action(state, "p2", {"type": "buy"})
            else:
                apply_action(state, "p2", {"type": "skip_buy"})
        elif state.phase == "end":
            apply_action(state, "p2", {"type": "end_turn"})
    save_game(state)
    return public_state(state, viewer)


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
