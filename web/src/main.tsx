import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { clawdTurn, createGame, gameIdFromPath, getGame, sendAction, tokenFromUrl } from "./api";
import type { GameAction, GameState, Space } from "./types";
import "./styles.css";

const PLAYER_EMOJI = { p1: "🧑‍🚀", p2: "🤖" } as const;
const COLOR: Record<string, string> = {
  brown: "#8b5a2b",
  "light-blue": "#7dd3fc",
  pink: "#f472b6",
  orange: "#fb923c",
  railroad: "#94a3b8",
  utility: "#facc15"
};

function App() {
  const [gameId, setGameId] = useState<string | null>(gameIdFromPath());
  const [token, setToken] = useState<string | null>(tokenFromUrl());
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const created = await createGame();
      const url = new URL(created.browserUrl);
      const nextToken = url.searchParams.get("token")!;
      setGameId(created.gameId);
      setToken(nextToken);
      window.history.replaceState(null, "", `/game/${created.gameId}?token=${nextToken}`);
      const loaded = await getGame(created.gameId, nextToken);
      setState(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    if (!gameId || !token) return;
    try {
      setState(await getGame(gameId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function act(action: GameAction) {
    if (!gameId || !token) return;
    setBusy(true);
    setError(null);
    try {
      let next = await sendAction(gameId, token, action);
      if (next.viewer === "p1" && next.turn === "p2" && next.phase !== "finished") {
        next = await clawdTurn(gameId, token);
      }
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (gameId && token) refresh();
  }, []);

  const legal = useMemo(() => new Set(state?.legalActions.map((a) => a.type) ?? []), [state]);

  if (!state) {
    return <main className="landing">
      <div className="hero hero-with-art">
        <div className="hero-copy">
          <p className="eyebrow">Panda Capital</p>
        <h1>Patrik vs Clawd, capitalism but couch-safe.</h1>
        <p>Docker-first mini game inspired by the Durak/Quoridor app shape. Roll dice, buy dumb little startup properties, bankrupt your AI friend.</p>
        <button onClick={start} disabled={busy}>{busy ? "Creating…" : "Start new game"}</button>
        {error && <p className="error">{error}</p>}
        </div>
        <img className="hero-art" src="/panda-capital-key-art.png" alt="Panda Capital key art" />
      </div>
    </main>;
  }

  return <main className="app-shell">
    <header>
      <div>
        <p className="eyebrow">Game {state.id} · v{state.version}</p>
        <h1>Panda Capital</h1>
      </div>
      <button className="ghost" onClick={start} disabled={busy}>New game</button>
    </header>

    <section className="status-card">
      <div>
        <span className="label">Turn</span>
        <strong>{PLAYER_EMOJI[state.turn]} {state.names[state.turn]}</strong>
      </div>
      <div>
        <span className="label">Phase</span>
        <strong>{state.phase}</strong>
      </div>
      <div>
        <span className="label">Last roll</span>
        <strong>{state.lastRoll ? `${state.lastRoll[0]} + ${state.lastRoll[1]}` : "—"}</strong>
      </div>
      {state.winner && <div className="winner">🏆 {state.names[state.winner]} wins</div>}
    </section>

    <section className="layout">
      <Board state={state} />
      <aside>
        <PlayerPanel state={state} player="p1" />
        <PlayerPanel state={state} player="p2" />
        <div className="actions card">
          <h2>Actions</h2>
          <button onClick={() => act({ type: "roll" })} disabled={busy || !legal.has("roll")}>🎲 Roll</button>
          <button onClick={() => act({ type: "buy" })} disabled={busy || !legal.has("buy")}>Buy</button>
          <button onClick={() => act({ type: "skip_buy" })} disabled={busy || !legal.has("skip_buy")}>Skip buy</button>
          <button onClick={() => act({ type: "end_turn" })} disabled={busy || !legal.has("end_turn")}>End turn</button>
          <button className="ghost" onClick={refresh} disabled={busy}>Refresh</button>
          {error && <p className="error">{error}</p>}
        </div>
      </aside>
    </section>

    <section className="card history">
      <h2>Log</h2>
      {[...state.history].reverse().map((h, i) => <p key={i}>{h.message ?? JSON.stringify(h)}</p>)}
    </section>
  </main>;
}

function Board({ state }: { state: GameState }) {
  return <div className="board card">
    {state.board.map((space) => <Tile key={space.id} space={space} state={state} />)}
  </div>;
}

function Tile({ space, state }: { space: Space; state: GameState }) {
  const owner = state.owners[String(space.id)];
  const occupants = state.players.filter((p) => state.playerState[p].position === space.id);
  return <div className={`tile ${space.kind}`}>
    <div className="stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "transparent" }} />
    <span className="tile-id">{space.id}</span>
    <strong>{space.name}</strong>
    {space.price > 0 && <small>€{space.price} · rent €{space.rent || "dice×4"}</small>}
    {owner && <em>owned by {state.names[owner]}</em>}
    <div className="tokens">{occupants.map((p) => <span key={p}>{PLAYER_EMOJI[p]}</span>)}</div>
  </div>;
}

function PlayerPanel({ state, player }: { state: GameState; player: "p1" | "p2" }) {
  const info = state.playerState[player];
  const owned = Object.entries(state.owners).filter(([, owner]) => owner === player).map(([id]) => state.board[Number(id)]);
  return <div className="card player">
    <h2>{PLAYER_EMOJI[player]} {state.names[player]}</h2>
    <div className="money">€{info.cash}</div>
    <p>Net worth: €{info.netWorth}</p>
    <p>Position: {state.board[info.position].name}</p>
    <div className="owned">{owned.length ? owned.map((s) => <span key={s.id}>{s.name}</span>) : <small>No properties yet.</small>}</div>
  </div>;
}

createRoot(document.getElementById("root")!).render(<App />);
