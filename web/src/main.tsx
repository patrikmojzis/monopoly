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
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

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
  useEffect(() => {
    if (!gameId || !token || state?.phase === "finished") return;
    const id = window.setInterval(() => { refresh(); }, 8000);
    return () => window.clearInterval(id);
  }, [gameId, token, state?.phase]);

  const legal = useMemo(() => state?.legalActions ?? [], [state]);
  const selectedSpace = state ? state.board[selectedSpaceId ?? state.pendingSpace ?? state.playerState[state.turn].position] : null;

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
      <div><span className="label">Phase</span><strong>{phaseLabel(state.phase)}</strong></div>
      <div><span className="label">Last roll</span><strong>{state.lastRoll ? `${state.lastRoll[0]} + ${state.lastRoll[1]}` : "—"}</strong></div>
      <div><span className="label">Doubles</span><strong>{state.doublesInRow || "—"}</strong></div>
      {state.winner && <div className="winner">🏆 {state.names[state.winner]} wins</div>}
    </section>

    <TurnBanner state={state} />
    <TablePulse state={state} />
    <PortfolioStrip state={state} />
    <RulesCard />
    <CurrentSpot state={state} />

    <section className="layout classic-layout">
      <div className="board-wrap"><BoardControls /><Board state={state} selectedId={selectedSpace?.id ?? null} onSelect={setSelectedSpaceId} />{selectedSpace && <DeedCard state={state} space={selectedSpace} />}<GroupTracker state={state} /><BoardLegend /></div>
      <aside>
        {state.players.map((p) => <PlayerPanel key={p} state={state} player={p} />)}
        <div className="actions card">
          <h2>Legal actions</h2>
          {legal.length ? legal.map((a, idx) => <button className={`action-btn action-${a.type}`} key={`${a.type}-${a.spaceId ?? idx}`} onClick={() => act(cleanAction(a))} disabled={busy || !state.canAct}><span>{actionIcon(a.type)}</span>{a.label ?? labelFor(a.type)}</button>) : <p className="muted">No actions for this token right now.</p>}
          {state.turn !== state.viewer && state.phase !== "finished" && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Let {state.names[state.turn]} play</button>}
          {error && <p className="error">{error}</p>}
        </div>
      </aside>
    </section>

    <section className="card history"><h2>Latest log</h2>{[...state.history].reverse().slice(0, 14).map((h, i) => <p key={i}><span>{eventIcon(String(h.type ?? ""))}</span>{h.message ?? JSON.stringify(h)}</p>)}</section>
    <MobileActionDock state={state} legal={legal} busy={busy} act={act} runBot={runBot} />
  </main>;
}

function MobileActionDock({ state, legal, busy, act, runBot }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number })[]; busy: boolean; act: (a: GameAction) => void; runBot: () => void }) {
  if (state.phase === "finished") return null;
  const latest = state.history[state.history.length - 1]?.message;
  const viewerTurn = state.turn === state.viewer && state.canAct;
  return <div className={`mobile-action-dock ${viewerTurn ? "active" : "waiting"}`}>
    <div className="dock-summary"><strong>{viewerTurn ? "Tvoj ťah" : `${state.names[state.turn]} hrá`}</strong><span>{latest ?? "Čakáme na hod."}</span></div>
    <div className="dock-buttons">
      {viewerTurn && legal.slice(0, 2).map((a, idx) => <button className={`action-btn action-${a.type}`} key={`${a.type}-${a.spaceId ?? idx}`} onClick={() => act(cleanAction(a))} disabled={busy}><span>{actionIcon(a.type)}</span>{a.label ?? labelFor(a.type)}</button>)}
      {!viewerTurn && state.turn !== state.viewer && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Bot turn</button>}
      <button className="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Top</button>
    </div>
  </div>;
}

function InvitePanel({ created, state }: { created: CreateGameResponse; state: GameState }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(label: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1300);
    } catch {
      setCopied("Manual copy");
    }
  }
  return <section className="card invites">
    <div className="section-title"><h2>Invite links</h2>{copied && <span className="copied">Copied: {copied}</span>}</div>
    <p className="muted">Share browser links with humans. Agents use the same seat token as bearer auth.</p>
    <div className="invite-grid">
      {state.players.map((p) => <div key={p} className="invite-item">
        <strong>{emojiFor(state, p)} {state.names[p]}</strong>
        <code>{created.playerUrls[p]}</code>
        <button className="copy-btn" onClick={() => copy(state.names[p], created.playerUrls[p])}>Copy invite</button>
      </div>)}
      <div className="invite-item"><strong>👀 Spectator</strong><code>{created.spectatorUrl}</code><button className="copy-btn" onClick={() => copy("Spectator", created.spectatorUrl)}>Copy spectator</button></div>
    </div>
  </section>;
}

function BoardControls() {
  function pan(where: "start" | "mid" | "end") {
    const scroller = document.querySelector(".layout");
    if (!scroller) return;
    const el = scroller as HTMLElement;
    const left = where === "start" ? 0 : where === "mid" ? el.scrollWidth / 2 - el.clientWidth / 2 : el.scrollWidth;
    el.scrollTo({ left, behavior: "smooth" });
  }
  return <div className="card board-controls">
    <span>Board pan</span>
    <button onClick={() => pan("start")}>← left</button>
    <button onClick={() => pan("mid")}>◇ center</button>
    <button onClick={() => pan("end")}>right →</button>
  </div>;
}

function RulesCard() {
  return <details className="card rules-card">
    <summary>🎲 Ako hrať / quick rules</summary>
    <ul>
      <li>Hoď kockami, kúp voľné políčko alebo ho nechaj banke.</li>
      <li>Keď stojíš na cudzom majetku, platíš nájom automaticky.</li>
      <li>Celá farebná skupina odomkne stavanie domov/hotela.</li>
      <li>Doubles = ideš ešte raz; tri doubles = väzenie, klasika cursed.</li>
      <li>Na mobile používaj spodný action dock a pan buttons pri doske.</li>
    </ul>
  </details>;
}

function PortfolioStrip({ state }: { state: GameState }) {
  return <section className="card portfolio-strip">
    {state.players.map((p) => {
      const owned = Object.entries(state.owners).filter(([, owner]) => owner === p).map(([id]) => state.board[Number(id)]);
      return <div key={p} className="portfolio-mini">
        <strong>{emojiFor(state, p)} {state.names[p]}</strong>
        <span>{owned.length ? owned.slice(0, 3).map((s) => s.name).join(" · ") : "bez majetku zatiaľ"}</span>
      </div>;
    })}
  </section>;
}

function spaceIcon(kind: string) {
  return ({ go: "💰", property: "🏘️", tax: "🧾", chance: "❓", chest: "🎁", jail: "🚔", go_to_jail: "🚨", free_parking: "🛋️", railroad: "🚋", utility: "⚡" } as Record<string, string>)[kind] ?? "▫️";
}

function TablePulse({ state }: { state: GameState }) {
  const ranked = [...state.players].sort((a, b) => state.playerState[b].netWorth - state.playerState[a].netWorth);
  const leader = ranked[0];
  const bankOwned = state.board.filter((s) => s.isBuyable && !state.owners[String(s.id)]).length;
  const owned = Object.keys(state.owners).length;
  return <section className="card table-pulse">
    <div><span className="label">Leader</span><strong>{emojiFor(state, leader)} {state.names[leader]} · €{state.playerState[leader].netWorth}</strong></div>
    <div><span className="label">Market</span><strong>{owned} owned · {bankOwned} free</strong></div>
    <div><span className="label">Round vibe</span><strong>{state.history.length < 10 ? "opening chaos" : owned < 12 ? "land grab" : "rent war"}</strong></div>
  </section>;
}

function TurnBanner({ state }: { state: GameState }) {
  const latest = state.history[state.history.length - 1];
  const viewerTurn = state.turn === state.viewer && state.canAct && state.phase !== "finished";
  return <section className={`turn-banner card ${viewerTurn ? "your-turn" : "waiting"}`}>
    <div className="dice-face">{state.lastRoll ? <><span>{dieFace(state.lastRoll[0])}</span><span>{dieFace(state.lastRoll[1])}</span></> : <><span>⚂</span><span>⚄</span></>}</div>
    <div>
      <p className="eyebrow">{viewerTurn ? "Your move" : state.phase === "finished" ? "Game over" : "Table update"}</p>
      <h2>{viewerTurn ? `${emojiFor(state, state.viewer)} ${state.names[state.viewer]}, ideš` : `${emojiFor(state, state.turn)} ${state.names[state.turn]} je na rade`}</h2>
      <p>{latest?.message ?? "Čakáme na prvý hod."}</p>
    </div>
  </section>;
}

function dieFace(n: number) {
  return ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][Math.max(1, Math.min(6, n)) - 1] ?? "🎲";
}

function phaseLabel(phase: string) {
  return ({ roll: "hod", buy: "kúpa", end: "koniec ťahu", finished: "koniec hry" } as Record<string, string>)[phase] ?? phase;
}

function actionIcon(type: string) {
  return ({ roll: "🎲", buy: "💸", skip_buy: "➡️", end_turn: "✅", pay_jail: "🚔", use_jail_card: "🎟️", build: "🏗️" } as Record<string, string>)[type] ?? "👉";
}

function CurrentSpot({ state }: { state: GameState }) {
  const player = state.turn;
  const ps = state.playerState[player];
  const space = state.board[state.pendingSpace ?? ps.position];
  const owner = state.owners[String(space.id)];
  const buildings = state.buildings[String(space.id)] ?? 0;
  return <section className="card current-spot">
    <div className="spot-main">
      <span className="spot-icon">{space.kind === "property" ? "🏠" : space.kind === "railroad" ? "🚋" : space.kind === "utility" ? "⚡" : space.kind === "chance" ? "❓" : space.kind === "chest" ? "🎁" : space.kind === "jail" || space.kind === "go_to_jail" ? "🚔" : "🎲"}</span>
      <div>
        <p className="eyebrow">Current space</p>
        <h2>{space.name}</h2>
        <p>{emojiFor(state, player)} {state.names[player]} · {space.kind.replace(/_/g, " ")}</p>
      </div>
    </div>
    <div className="spot-stats">
      {space.price > 0 && <span>Price <strong>€{space.price}</strong></span>}
      {space.isBuyable && <span>Rent <strong>€{space.currentRent || space.rent || "dice"}</strong></span>}
      {owner && <span>Owner <strong>{emojiFor(state, owner)} {state.names[owner]}</strong></span>}
      {buildings > 0 && <span>Build <strong>{buildings === 5 ? "🏨 hotel" : `${buildings}× 🏠`}</strong></span>}
    </div>
  </section>;
}

function GroupTracker({ state }: { state: GameState }) {
  const groups = Array.from(new Set(state.board.map((s) => s.color).filter(Boolean))) as string[];
  return <section className="card group-tracker">
    <div className="section-title"><h2>Color groups</h2><span className="muted">monopoly radar</span></div>
    <div className="group-grid">
      {groups.map((color) => {
        const spaces = state.board.filter((s) => s.color === color);
        const byOwner = state.players.map((p) => ({ p, count: spaces.filter((sp) => state.owners[String(sp.id)] === p).length })).sort((a, b) => b.count - a.count)[0];
        const pct = spaces.length ? Math.round((byOwner.count / spaces.length) * 100) : 0;
        return <div key={color} className="group-chip">
          <b style={{ background: COLOR[color] ?? "#64748b" }} />
          <span>{color.replace(/-/g, " ")}</span>
          <strong>{byOwner.count ? `${emojiFor(state, byOwner.p)} ${byOwner.count}/${spaces.length}` : `0/${spaces.length}`}</strong>
          <i><em style={{ width: `${pct}%` }} /></i>
        </div>;
      })}
    </div>
  </section>;
}

function BoardLegend() {
  return <div className="card board-legend">
    <span><b style={{ background: COLOR.brown }} /> lacné štvrte</span>
    <span><b style={{ background: COLOR.red }} /> stred boardu</span>
    <span><b style={{ background: COLOR.green }} /> drahé štvrte</span>
    <span><b style={{ background: COLOR.railroad }} /> rails</span>
    <span><b style={{ background: COLOR.utility }} /> utility</span>
  </div>;
}

function eventIcon(type: string) {
  return ({ roll: "🎲", buy: "💸", rent: "🏦", card: "🃏", jail: "🚔", go_to_jail: "🚔", build: "🏗️", finish: "🏆", bankrupt: "💀", go: "💰" } as Record<string, string>)[type] ?? "•";
}

function Board({ state, selectedId, onSelect }: { state: GameState; selectedId: number | null; onSelect: (id: number) => void }) {
  return <div className="classic-board card">
    <div className="board-center">
      <p className="eyebrow">Panda Capital</p>
      <h2>Classic Board</h2>
      <p>Pass GO: €200 · Jail on 10 · Go to Jail on 30 · Build after owning a color set.</p>
      <div className="dice-mark">⚂ ⚄</div>
    </div>
    {state.board.map((space) => <Tile key={space.id} space={space} state={state} selected={selectedId === space.id} onSelect={onSelect} />)}
  </div>;
}

function tileStyle(id: number): React.CSSProperties {
  if (id <= 10) return { gridColumn: 11 - id, gridRow: 11, "--gc": 11 - id, "--gr": 11 } as React.CSSProperties;
  if (id <= 20) return { gridColumn: 1, gridRow: 21 - id, "--gc": 1, "--gr": 21 - id } as React.CSSProperties;
  if (id <= 30) return { gridColumn: id - 19, gridRow: 1, "--gc": id - 19, "--gr": 1 } as React.CSSProperties;
  return { gridColumn: 11, gridRow: id - 29, "--gc": 11, "--gr": id - 29 } as React.CSSProperties;
}

function Tile({ space, state, selected, onSelect }: { space: Space; state: GameState; selected: boolean; onSelect: (id: number) => void }) {
  const owner = state.owners[String(space.id)];
  const occupants = state.players.filter((p) => state.playerState[p].position === space.id);
  const buildings = state.buildings[String(space.id)] ?? 0;
  return <button type="button" className={`tile classic-tile ${space.kind} ${selected ? "selected" : ""}`} style={tileStyle(space.id)} onClick={() => onSelect(space.id)} aria-label={`Show ${space.name}`}>
    <div className="stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "transparent" }} />
    <span className="tile-id">{space.id}</span><span className="tile-kind-icon">{spaceIcon(space.kind)}</span>
    <strong title={space.name}>{space.name}</strong>
    {space.price > 0 && <small>€{space.price} · rent €{space.currentRent || space.rent || "dice"}</small>}
    {buildings > 0 && <small className="houses">{buildings === 5 ? "🏨" : "🏠".repeat(buildings)}</small>}
    {owner && <em>{state.names[owner]}</em>}
    <div className="tokens">{occupants.map((p) => <span key={p}>{emojiFor(state, p)}</span>)}</div>
  </button>;
}

function DeedCard({ state, space }: { state: GameState; space: Space }) {
  const owner = state.owners[String(space.id)];
  const buildings = state.buildings[String(space.id)] ?? 0;
  const occupants = state.players.filter((p) => state.playerState[p].position === space.id);
  return <section className="card deed-card">
    <div className="deed-stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "linear-gradient(135deg,#facc15,#fb923c)" }} />
    <div className="deed-body">
      <p className="eyebrow">Deed / políčko #{space.id}</p>
      <h2>{space.name}</h2>
      <div className="deed-grid">
        <span>Typ <strong>{space.kind.replace(/_/g, " ")}</strong></span>
        {space.price > 0 && <span>Cena <strong>€{space.price}</strong></span>}
        {space.isBuyable && <span>Nájom <strong>€{space.currentRent || space.rent || "dice"}</strong></span>}
        {owner && <span>Majiteľ <strong>{emojiFor(state, owner)} {state.names[owner]}</strong></span>}
        {buildings > 0 && <span>Domy <strong>{buildings === 5 ? "hotel" : buildings}</strong></span>}
        {occupants.length > 0 && <span>Na políčku <strong>{occupants.map((p) => `${emojiFor(state, p)} ${state.names[p]}`).join(", ")}</strong></span>}
      </div>
    </div>
  </section>;
}

function PlayerPanel({ state, player }: { state: GameState; player: Player }) {
  const info = state.playerState[player];
  const owned = Object.entries(state.owners).filter(([, owner]) => owner === player).map(([id]) => state.board[Number(id)]);
  return <div className={`card player ${!info.active ? "inactive" : ""}`}>
    <h2>{emojiFor(state, player)} {state.names[player]}</h2>
    <div className="money">€{info.cash}</div>
    <div className="wealth-bar"><i style={{ width: `${Math.min(100, Math.max(4, info.netWorth / 30))}%` }} /></div>
    <p>Net worth: €{info.netWorth} · Properties: {owned.length}</p>
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
