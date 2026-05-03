import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { botTurn, createGame, gameIdFromPath, getGame, sendAction, tokenFromUrl } from "./api";
import type { CreateGameResponse, GameAction, GameState, Player, Space } from "./types";
import "./styles.css";

const PLAYER_EMOJI = ["🧑‍🚀", "🤖", "🌙", "🐈"];
const COLOR: Record<string, string> = {
  brown: "#8b5a2b",
  "light-blue": "#7dd3fc",
  pink: "#f472b6",
  orange: "#fb923c",
  red: "#ef4444",
  yellow: "#facc15",
  green: "#22c55e",
  "dark-blue": "#2563eb",
  railroad: "#94a3b8",
  utility: "#a3e635"
};

function App() {
  const [gameId, setGameId] = useState<string | null>(gameIdFromPath());
  const [token, setToken] = useState<string | null>(tokenFromUrl());
  const [state, setState] = useState<GameState | null>(null);
  const [created, setCreated] = useState<CreateGameResponse | null>(null);
  const [names, setNames] = useState(["Patrik", "Clawd", "Angelina", "Luna"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const activeNames = names.map((n) => n.trim()).filter(Boolean).slice(0, 4);
      const next = await createGame(activeNames.length >= 2 ? activeNames : ["Patrik", "Clawd"]);
      const url = new URL(next.browserUrl);
      const nextToken = url.searchParams.get("token")!;
      setCreated(next);
      setGameId(next.gameId);
      setToken(nextToken);
      window.history.replaceState(null, "", `/game/${next.gameId}?token=${nextToken}`);
      setState(await getGame(next.gameId, nextToken));
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
      setState(await sendAction(gameId, token, action));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function runBot() {
    if (!gameId || !token) return;
    setBusy(true);
    setError(null);
    try {
      setState(await botTurn(gameId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { if (gameId && token) refresh(); }, []);

  const legal = useMemo(() => state?.legalActions ?? [], [state]);

  if (!state) {
    return <main className="landing">
      <div className="hero hero-with-art">
        <div className="hero-copy">
          <p className="eyebrow">Panda Capital v2</p>
          <h1>Classic property-board chaos, bearer-token style.</h1>
          <p>Forty spaces, 2–4 players, railroads, utilities, Jail, Chance, Community Cache, houses/hotels-lite — original skin, Monopoly-ish couch energy.</p>
          <div className="hero-badges"><span>🎲 Bearer-token API</span><span>🏘️ 40 spaces</span><span>🌙 4-player chaos</span></div>
          <div className="name-grid">
            {names.map((name, i) => <label key={i}>Player {i + 1}<input value={name} onChange={(e) => setNames(names.map((n, idx) => idx === i ? e.target.value : n))} /></label>)}
          </div>
          <button onClick={start} disabled={busy}>{busy ? "Creating…" : "Start table"}</button>
          {error && <p className="error">{error}</p>}
        </div>
        <img className="hero-art" src="/panda-capital-key-art.png" alt="Panda Capital key art" />
      </div>
    </main>;
  }

  return <main className="app-shell">
    <header>
      <div>
        <p className="eyebrow">Game {state.id} · v{state.version} · viewer {state.names[state.viewer] ?? state.viewer}</p>
        <h1><span>Panda</span> Capital</h1>
      </div>
      <div className="header-actions">
        <button className="ghost" onClick={refresh} disabled={busy}>Refresh</button>
        <button className="ghost" onClick={start} disabled={busy}>New table</button>
      </div>
    </header>

    {created && <InvitePanel created={created} state={state} />}

    <section className="status-card">
      <div><span className="label">Turn</span><strong>{emojiFor(state, state.turn)} {state.names[state.turn]}</strong></div>
      <div><span className="label">Phase</span><strong>{state.phase}</strong></div>
      <div><span className="label">Last roll</span><strong>{state.lastRoll ? `${state.lastRoll[0]} + ${state.lastRoll[1]}` : "—"}</strong></div>
      <div><span className="label">Doubles</span><strong>{state.doublesInRow || "—"}</strong></div>
      {state.winner && <div className="winner">🏆 {state.names[state.winner]} wins</div>}
    </section>

    <section className="layout classic-layout">
      <Board state={state} />
      <aside>
        {state.players.map((p) => <PlayerPanel key={p} state={state} player={p} />)}
        <div className="actions card">
          <h2>Legal actions</h2>
          {legal.length ? legal.map((a, idx) => <button key={`${a.type}-${a.spaceId ?? idx}`} onClick={() => act(cleanAction(a))} disabled={busy || !state.canAct}>{a.label ?? labelFor(a.type)}</button>) : <p className="muted">No actions for this token right now.</p>}
          {state.turn !== "p1" && state.phase !== "finished" && <button className="ghost" onClick={runBot} disabled={busy}>🤖 Let current bot play</button>}
          {error && <p className="error">{error}</p>}
        </div>
      </aside>
    </section>

    <section className="card history"><h2>Log</h2>{[...state.history].reverse().map((h, i) => <p key={i}>{h.message ?? JSON.stringify(h)}</p>)}</section>
  </main>;
}

function InvitePanel({ created, state }: { created: CreateGameResponse; state: GameState }) {
  return <section className="card invites">
    <h2>Invite links / API tokens</h2>
    <p className="muted">Share the browser link with humans. Agents can use the bearer config from the same player.</p>
    <div className="invite-grid">
      {state.players.map((p) => <div key={p} className="invite-item">
        <strong>{emojiFor(state, p)} {state.names[p]}</strong>
        <code>{created.playerUrls[p]}</code>
      </div>)}
      <div className="invite-item"><strong>👀 Spectator</strong><code>{created.spectatorUrl}</code></div>
    </div>
  </section>;
}

function Board({ state }: { state: GameState }) {
  return <div className="classic-board card">
    <div className="board-center">
      <p className="eyebrow">Panda Capital</p>
      <h2>Classic Board</h2>
      <p>Pass GO: €200 · Jail on 10 · Go to Jail on 30 · Build after owning a color set.</p>
      <div className="dice-mark">⚂ ⚄</div>
    </div>
    {state.board.map((space) => <Tile key={space.id} space={space} state={state} />)}
  </div>;
}

function tileStyle(id: number): React.CSSProperties {
  if (id <= 10) return { gridColumn: 11 - id, gridRow: 11, "--gc": 11 - id, "--gr": 11 } as React.CSSProperties;
  if (id <= 20) return { gridColumn: 1, gridRow: 21 - id, "--gc": 1, "--gr": 21 - id } as React.CSSProperties;
  if (id <= 30) return { gridColumn: id - 19, gridRow: 1, "--gc": id - 19, "--gr": 1 } as React.CSSProperties;
  return { gridColumn: 11, gridRow: id - 29, "--gc": 11, "--gr": id - 29 } as React.CSSProperties;
}

function Tile({ space, state }: { space: Space; state: GameState }) {
  const owner = state.owners[String(space.id)];
  const occupants = state.players.filter((p) => state.playerState[p].position === space.id);
  const buildings = state.buildings[String(space.id)] ?? 0;
  return <div className={`tile classic-tile ${space.kind}`} style={tileStyle(space.id)}>
    <div className="stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "transparent" }} />
    <span className="tile-id">{space.id}</span>
    <strong title={space.name}>{space.name}</strong>
    {space.price > 0 && <small>€{space.price} · rent €{space.currentRent || space.rent || "dice"}</small>}
    {buildings > 0 && <small className="houses">{buildings === 5 ? "🏨" : "🏠".repeat(buildings)}</small>}
    {owner && <em>{state.names[owner]}</em>}
    <div className="tokens">{occupants.map((p) => <span key={p}>{emojiFor(state, p)}</span>)}</div>
  </div>;
}

function PlayerPanel({ state, player }: { state: GameState; player: Player }) {
  const info = state.playerState[player];
  const owned = Object.entries(state.owners).filter(([, owner]) => owner === player).map(([id]) => state.board[Number(id)]);
  return <div className={`card player ${!info.active ? "inactive" : ""}`}>
    <h2>{emojiFor(state, player)} {state.names[player]}</h2>
    <div className="money">€{info.cash}</div>
    <p>Net worth: €{info.netWorth}</p>
    <p>Position: {state.board[info.position].name}</p>
    {info.jailTurns > 0 && <p>🚔 Jail turns: {info.jailTurns}</p>}
    {info.jailCards > 0 && <p>🎟️ Rate-limit passes: {info.jailCards}</p>}
    <div className="owned">{owned.length ? owned.map((s) => <span key={s.id} style={{ borderColor: s.color ? COLOR[s.color] : undefined }}>{s.name}</span>) : <small>No properties yet.</small>}</div>
  </div>;
}

function emojiFor(state: GameState, player: Player) {
  const idx = state.players.indexOf(player);
  return PLAYER_EMOJI[idx] ?? "🎲";
}

function cleanAction(a: GameAction & { label?: string }): GameAction {
  if (a.type === "build") return { type: "build", spaceId: a.spaceId };
  return { type: a.type } as GameAction;
}

function labelFor(type: string) {
  return ({ roll: "🎲 Roll", buy: "Buy", skip_buy: "Skip buy", end_turn: "End turn", pay_jail: "Pay jail", use_jail_card: "Use jail card", build: "Build" } as Record<string, string>)[type] ?? type;
}

createRoot(document.getElementById("root")!).render(<App />);
