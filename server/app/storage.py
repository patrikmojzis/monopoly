from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any

from .engine import GameState, PlayerState

DB_PATH = Path(os.environ.get("MONOPOLY_DB_PATH", "data/dev.sqlite3"))


def _default(value: Any) -> Any:
    if is_dataclass(value):
        return asdict(value)
    raise TypeError(type(value).__name__)


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, state_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
    return conn


def save_game(state: GameState) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO games(id, state_json, updated_at) VALUES(?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json, updated_at=CURRENT_TIMESTAMP",
            (state.id, json.dumps(state, default=_default)),
        )


def load_game(game_id: str) -> GameState | None:
    with connect() as conn:
        row = conn.execute("SELECT state_json FROM games WHERE id = ?", (game_id,)).fetchone()
    if not row:
        return None
    raw = json.loads(row[0])
    raw["player_state"] = {p: PlayerState(**ps) for p, ps in raw["player_state"].items()}
    raw["owners"] = {int(k): v for k, v in raw.get("owners", {}).items()}
    raw["last_roll"] = tuple(raw["last_roll"]) if raw.get("last_roll") else None
    return GameState(**raw)
