import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { botTurn, createGame, gameIdFromPath, getGame, sendAction, tokenFromUrl } from "./api";
import type { CreateGameResponse, GameAction, GameState, Player, Space } from "./types";
import "./styles.css";

const PLAYER_EMOJI = ["🧑‍🚀", "🤖", "🌙", "🐈"];
type DrawerName = "cards" | "log" | "menu" | "players" | "rules" | "trade";

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
  const [names, setNames] = useState(["Patrik", "Clawd"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [autoBots, setAutoBots] = useState(() => localStorage.getItem("panda-capital-autobots") === "1");
  const [openDrawer, setOpenDrawer] = useState<DrawerName | null>(null);

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
    document.body.classList.toggle("game-mode-active", !!state);
    return () => document.body.classList.remove("game-mode-active");
  }, [!!state]);
  useEffect(() => {
    if (!gameId || !token || state?.phase === "finished") return;
    const id = window.setInterval(() => { refresh(); }, 8000);
    return () => window.clearInterval(id);
  }, [gameId, token, state?.phase]);
  useEffect(() => { localStorage.setItem("panda-capital-autobots", autoBots ? "1" : "0"); }, [autoBots]);
  useEffect(() => {
    if (!autoBots || !state || busy || state.phase === "finished" || state.turn === state.viewer || !isNpcSeat(state, state.turn)) return;
    const id = window.setTimeout(() => { runBot(); }, 900);
    return () => window.clearTimeout(id);
  }, [autoBots, busy, state?.turn, state?.phase, state?.version]);

  const legal = useMemo(() => state?.legalActions ?? [], [state]);
  const buttonActions = legal.filter((a) => a.type !== "propose_trade");
  const selectedSpace = state ? state.board[selectedSpaceId ?? state.pendingSpace ?? state.playerState[state.turn].position] : null;
  const hasNpcSeats = state ? state.players.some((p) => isNpcSeat(state, p)) : false;

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
          <div className="player-count-actions">
            {names.length < 4 && <button className="ghost" type="button" onClick={() => setNames([...names, names.length === 2 ? "Angelina" : "Luna"])}>+ add player</button>}
            {names.length > 2 && <button className="ghost" type="button" onClick={() => setNames(names.slice(0, -1))}>− remove player</button>}
          </div>
          <button onClick={start} disabled={busy}>{busy ? "Creating…" : "Start table"}</button>
          {error && <p className="error">{error}</p>}
        </div>
        <img className="hero-art" src="/panda-capital-key-art.png" alt="Panda Capital key art" />
      </div>
    </main>;
  }

  return <main className="game-mode-shell">
    <GameTopChrome state={state} busy={busy} refresh={refresh} start={start} setOpenDrawer={setOpenDrawer} />
    <GameHud state={state} />

    <section className="game-board-stage">
      <SeatRail state={state} />
      <div className="board-scroll">
        <div className="board-canvas">
          <Board state={state} selectedId={selectedSpace?.id ?? null} onSelect={setSelectedSpaceId} />
        </div>
      </div>
      <BoardControls state={state} selectedId={selectedSpace?.id ?? null} />
      {selectedSpace && <div className="floating-deed"><DeedCard state={state} space={selectedSpace} /></div>}
      <AuctionBanner state={state} legal={buttonActions} busy={busy} act={act} runBot={runBot} />
      <DebtBanner state={state} legal={buttonActions} busy={busy} act={act} />
      <GameEffects state={state} />
    </section>

    <GameActionDock state={state} legal={buttonActions} busy={busy} act={act} runBot={runBot} setOpenDrawer={setOpenDrawer} autoBots={autoBots} />
    <GameDrawer open={openDrawer} onClose={() => setOpenDrawer(null)} state={state} created={created} error={error} refresh={refresh} start={start} autoBots={autoBots} setAutoBots={setAutoBots} hasNpcSeats={hasNpcSeats} setOpenDrawer={setOpenDrawer} selectedSpaceId={selectedSpaceId} setSelectedSpaceId={setSelectedSpaceId} act={act} busy={busy} />
  </main>;
}
function GameTopChrome({ state, busy, refresh, start, setOpenDrawer }: { state: GameState; busy: boolean; refresh: () => void; start: () => void; setOpenDrawer: (drawer: DrawerName | null) => void }) {
  return <header className="game-top-chrome">
    <button className="brand-chip" onClick={() => setOpenDrawer("menu")} aria-label="Open game menu"><span>🎩</span><b>Panda Capital</b></button>
    <div className="chrome-center"><span>Game {state.id}</span><i>v{state.version}</i></div>
    <nav className="chrome-actions">
      <button className="ghost" onClick={refresh} disabled={busy}>↻</button>
      <button className="ghost" onClick={() => setOpenDrawer("log")}>Log</button>
      <button className="ghost" onClick={() => setOpenDrawer("menu")}>☰</button>
    </nav>
  </header>;
}

function GameHud({ state }: { state: GameState }) {
  const viewerInfo = state.playerState[state.viewer];
  return <section className="game-hud">
    <div className="hud-pill viewer"><span>{emojiFor(state, state.viewer)}</span><b>{state.names[state.viewer]}</b><strong>€{viewerInfo.cash}</strong></div>
    <div className="hud-pill turn"><span>{emojiFor(state, state.turn)}</span><b>{state.names[state.turn]}</b><strong>{phaseLabel(state.phase)}</strong></div>
    <div key={`dice-${state.version}-${state.lastRoll?.join("-") ?? "none"}`} className="hud-pill dice dice-pop"><b>{state.lastRoll ? `${dieFace(state.lastRoll[0])} ${dieFace(state.lastRoll[1])}` : "🎲 🎲"}</b><strong>{state.lastRoll ? `${state.lastRoll[0]}+${state.lastRoll[1]}` : "roll"}</strong></div>
    <div className="hud-pill pot"><b>🅿️</b><strong>€{state.freeParkingPot}</strong></div>
  </section>;
}

function GameActionDock({ state, legal, busy, act, runBot, setOpenDrawer, autoBots }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number; amount?: number })[]; busy: boolean; act: (a: GameAction) => void; runBot: () => void; setOpenDrawer: (drawer: DrawerName | null) => void; autoBots: boolean }) {
  const viewerTurn = state.turn === state.viewer && state.canAct;
  const primary = legal.filter((a) => !["mortgage", "unmortgage", "build", "sell_building", "propose_trade"].includes(a.type)).slice(0, 3);
  const latest = state.history[state.history.length - 1]?.message;
  const waitingNpc = !viewerTurn && state.turn !== state.viewer && isNpcSeat(state, state.turn);
  return <section className={`game-action-dock ${viewerTurn ? "active" : "waiting"}`}>
    <div className="dock-copy">
      <span className="label">{viewerTurn ? "Your move" : state.phase === "finished" ? "Game over" : "Waiting"}</span>
      <strong>{viewerTurn ? actionPrompt(state) : `${emojiFor(state, state.turn)} ${state.names[state.turn]} is up`}</strong>
      <small>{latest ?? "Čakáme na prvý hod."}</small>
    </div>
    <div className="dock-primary-actions">
      {viewerTurn && primary.length ? primary.map((a, idx) => <button className={`action-btn action-${a.type}`} key={`${a.type}-${a.spaceId ?? "x"}-${a.amount ?? idx}`} onClick={() => act(cleanAction(a))} disabled={busy}><span>{actionIcon(a.type)}</span>{a.label ?? labelFor(a.type)}</button>) : null}
      {waitingNpc && !autoBots && <button className="ghost bot-button" onClick={runBot} disabled={busy}>Run NPC</button>}
      {!viewerTurn && !waitingNpc && state.phase !== "finished" && <span className="waiting-chip">No button here — real player/agent turn</span>}
      <button className="ghost" onClick={() => setOpenDrawer("cards")}>Cards</button>
      <button className="ghost" onClick={() => setOpenDrawer("trade")}>Trade</button>
      <button className="ghost" onClick={() => setOpenDrawer("menu")}>Menu</button>
    </div>
  </section>;
}

function GameDrawer({ open, onClose, state, created, error, refresh, start, autoBots, setAutoBots, hasNpcSeats, setOpenDrawer, selectedSpaceId, setSelectedSpaceId, act, busy }: { open: DrawerName | null; onClose: () => void; state: GameState; created: CreateGameResponse | null; error: string | null; refresh: () => void; start: () => void; autoBots: boolean; setAutoBots: (value: boolean) => void; hasNpcSeats: boolean; setOpenDrawer: (drawer: DrawerName | null) => void; selectedSpaceId: number | null; setSelectedSpaceId: (id: number) => void; act: (a: GameAction) => void; busy: boolean }) {
  if (!open) return null;
  return <div className="drawer-backdrop" onClick={onClose}>
    <aside className={`game-drawer drawer-${open}`} onClick={(e) => e.stopPropagation()}>
      <div className="drawer-title"><h2>{drawerTitle(open)}</h2><button className="ghost" onClick={onClose}>✕</button></div>
      {open === "cards" && <DeedHand state={state} selectedId={selectedSpaceId} onSelect={(id) => { setSelectedSpaceId(id); onClose(); }} />}
      {open === "log" && <section className="history"><h2>Latest log</h2>{[...state.history].reverse().slice(0, 24).map((h, i) => <p key={i}><span>{eventIcon(String(h.type ?? ""))}</span>{h.message ?? JSON.stringify(h)}</p>)}</section>}
      {open === "players" && <div className="drawer-stack">{state.players.map((p) => <PlayerPanel key={p} state={state} player={p} />)}</div>}
      {open === "rules" && <div className="drawer-stack"><RulesCard /><GroupTracker state={state} /><BoardLegend /></div>}
      {open === "trade" && <div className="drawer-stack"><PendingTrade state={state} act={act} busy={busy} /><TradeDesk state={state} act={act} busy={busy} /></div>}
      {open === "menu" && <div className="drawer-stack menu-grid">
        <button onClick={refresh} disabled={busy}>Refresh state</button>
        <button onClick={start} disabled={busy}>New table</button>
        <button onClick={() => onClose()}>Back to board</button>
        <button className="ghost" onClick={() => { onClose(); setTimeout(() => document.querySelector('.board-scroll')?.scrollTo({ left: 9999, top: 9999, behavior: 'smooth' }), 30); }}>Center-ish board</button>
        <button className="ghost" onClick={() => onClose()}>Settings soon</button>
        {hasNpcSeats && <label className="toggle-row"><input type="checkbox" checked={autoBots} onChange={(e) => setAutoBots(e.target.checked)} /> Auto-play NPCs</label>}
        {!hasNpcSeats && <p className="muted">No NPC seats here. Clawd/real players act from their own seat/API — no confusing bot button.</p>}
        <button className="ghost" onClick={() => setOpenDrawer("rules")}>Rules</button>
        {created && <InvitePanel created={created} state={state} />}
        {error && <p className="error">{error}</p>}
      </div>}
    </aside>
  </div>;
}

function GameEffects({ state }: { state: GameState }) {
  const latest = state.history[state.history.length - 1];
  const message = String(latest?.message ?? "");
  if (!message || state.phase === "finished") return null;
  const kind = effectKind(message);
  if (!kind) return null;
  return <div key={`effect-${state.version}`} className={`game-effect game-effect-${kind}`}>
    <span>{effectIcon(kind)}</span>
    <strong>{message}</strong>
  </div>;
}

function effectKind(message: string) {
  const m = message.toLowerCase();
  if (m.includes("nájom") || m.includes("platí") || m.includes("€")) return "payment";
  if (m.includes("karta") || m.includes("chance") || m.includes("náhoda")) return "card";
  if (m.includes("hodil") || m.includes("rolled")) return "dice";
  if (m.includes("kúpil") || m.includes("bought")) return "buy";
  if (m.includes("draž") || m.includes("bid")) return "auction";
  if (m.includes("väzenia") || m.includes("jail")) return "jail";
  if (m.includes("prišiel") || m.includes("landed")) return "landing";
  return null;
}

function effectIcon(kind: string) {
  return ({ payment: "💸", card: "🃏", dice: "🎲", buy: "🏷️", auction: "🔨", jail: "🚔", landing: "📍" } as Record<string, string>)[kind] ?? "✨";
}

function drawerTitle(open: DrawerName) {
  return ({ cards: "Your deed cards", log: "Game log", menu: "Game menu", players: "Players", rules: "Rules & groups", trade: "Trade desk" } as Record<DrawerName, string>)[open];
}

function actionPrompt(state: GameState) {
  if (state.phase === "auction") return "Auction time";
  if (state.phase === "debt") return "Debt crisis";
  if (state.phase === "buy") return "Buy or auction";
  if (state.phase === "roll") return "Roll dice";
  if (state.phase === "end") return "Wrap the turn";
  return "Game over";
}

function isNpcSeat(state: GameState, player: Player) {
  const name = (state.names[player] ?? "").toLowerCase();
  return ["luna", "angelina", "bot", "npc"].some((needle) => name.includes(needle));
}

function SeatRail({ state }: { state: GameState }) {
  return <section className="seat-rail">
    {state.players.map((p) => {
      const info = state.playerState[p];
      const owned = Object.values(state.owners).filter((o) => o === p).length;
      return <div key={p} className={`seat-card ${state.turn === p ? "active" : ""} ${state.viewer === p ? "viewer" : ""}`}>
        <span className="seat-token">{emojiFor(state, p)}</span>
        <div><strong>{state.names[p]}</strong><small>{state.board[info.position].name}</small></div>
        <b>€{info.cash}</b>
        <i>{owned} deeds</i>
      </div>;
    })}
  </section>;
}

function DeedHand({ state, selectedId, onSelect }: { state: GameState; selectedId?: number | null; onSelect?: (id: number) => void }) {
  const owned = Object.entries(state.owners).filter(([, owner]) => owner === state.viewer).map(([id]) => state.board[Number(id)]);
  const byColor = owned.reduce<Record<string, Space[]>>((acc, space) => {
    const key = space.color ?? space.kind;
    (acc[key] ??= []).push(space);
    return acc;
  }, {});
  return <section className="card deed-hand">
    <div className="section-title"><h2>Your deed cards</h2><span>{owned.length}</span></div>
    {owned.length ? <div className="deed-color-groups">
      {Object.entries(byColor).map(([group, spaces]) => <div key={group} className="deed-group">
        <div className="deed-group-label"><b style={{ background: COLOR[group] ?? "#94a3b8" }} /><span>{group.replace(/-/g, " ")}</span><em>{spaces.length}</em></div>
        <div className="deed-hand-grid">
          {spaces.map((space) => {
            const buildings = state.buildings[String(space.id)] ?? 0;
            const mortgaged = !!state.mortgaged[String(space.id)];
            const selected = selectedId === space.id;
            const CardTag = onSelect ? "button" : "article";
            return <CardTag key={space.id} type={onSelect ? "button" : undefined} onClick={onSelect ? () => onSelect(space.id) : undefined} className={`mini-deed ${selected ? "selected" : ""} ${mortgaged ? "mortgaged" : ""}`}>
              <b style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "#94a3b8" }} />
              <strong>{space.name}</strong>
              <small>{mortgaged ? "mortgaged · rent €0" : `rent €${space.currentRent || space.rent || "dice"}`}</small>
              <i>#{space.id} · {space.kind.replace(/_/g, " ")}</i>
              {buildings > 0 && <em>{buildings === 5 ? "🏨 hotel" : `🏠×${buildings}`}</em>}
            </CardTag>;
          })}
        </div>
      </div>)}
    </div> : <p className="muted">No deeds yet. Kapitalizmus ešte len bootuje.</p>}
  </section>;
}

function MobileActionDock({ state, legal, busy, act, runBot, autoBots }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number; amount?: number })[]; busy: boolean; act: (a: GameAction) => void; runBot: () => void; autoBots: boolean }) {
  if (state.phase === "finished") return null;
  const latest = state.history[state.history.length - 1]?.message;
  const viewerTurn = state.turn === state.viewer && state.canAct;
  const primary = (state.phase === "debt" ? legal : legal.filter((a) => !["mortgage", "unmortgage", "build", "sell_building", "propose_trade"].includes(a.type))).slice(0, 2);
  return <div className={`mobile-action-dock ${viewerTurn ? "active" : "waiting"}`}>
    <div className="dock-summary"><strong>{viewerTurn ? "Tvoj ťah" : `${state.names[state.turn]} hrá`}</strong><span>{latest ?? "Čakáme na hod."}</span></div>
    <div className="dock-buttons">
      {viewerTurn && primary.map((a, idx) => <button className={`action-btn action-${a.type}`} key={`${a.type}-${a.spaceId ?? "x"}-${a.amount ?? idx}`} onClick={() => act(cleanAction(a))} disabled={busy}><span>{actionIcon(a.type)}</span>{a.label ?? labelFor(a.type)}</button>)}
      {!viewerTurn && state.turn !== state.viewer && !autoBots && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Bot turn</button>}
      {!viewerTurn && state.turn !== state.viewer && autoBots && <span className="dock-autobot">🤖 auto</span>}
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
  return <details className="card invites invite-compact">
    <summary><span>Invite links</span>{copied && <em>Copied: {copied}</em>}</summary>
    <p className="muted">Share browser links with humans. Agents use the same seat token as bearer auth.</p>
    <div className="invite-grid">
      {state.players.map((p) => <div key={p} className="invite-item">
        <strong>{emojiFor(state, p)} {state.names[p]}</strong>
        <code>{created.playerUrls[p]}</code>
        <button className="copy-btn" onClick={() => copy(state.names[p], created.playerUrls[p])}>Copy invite</button>
      </div>)}
      <div className="invite-item"><strong>👀 Spectator</strong><code>{created.spectatorUrl}</code><button className="copy-btn" onClick={() => copy("Spectator", created.spectatorUrl)}>Copy spectator</button></div>
    </div>
  </details>;
}

function BoardControls({ state, selectedId }: { state: GameState; selectedId: number | null }) {
  function scroller() { return document.querySelector(".board-scroll") as HTMLElement | null; }
  function pan(where: "start" | "mid" | "end") {
    const el = scroller();
    if (!el) return;
    const left = where === "start" ? 0 : where === "mid" ? el.scrollWidth / 2 - el.clientWidth / 2 : el.scrollWidth;
    const top = where === "mid" ? el.scrollHeight / 2 - el.clientHeight / 2 : el.scrollTop;
    el.scrollTo({ left, top, behavior: "smooth" });
  }
  function focusTile(id: number) {
    const tile = document.querySelector(`[data-space-id="${id}"]`) as HTMLElement | null;
    tile?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }
  const viewerPos = state.playerState[state.viewer].position;
  return <div className="card board-controls">
    <span>Board</span>
    <button onClick={() => pan("start")} aria-label="Pan board left">←</button>
    <button onClick={() => pan("mid")} aria-label="Center board">◇</button>
    <button onClick={() => focusTile(viewerPos)} aria-label="Center my token">Me</button>
    {selectedId !== null && <button onClick={() => focusTile(selectedId)} aria-label="Center selected tile">Sel</button>}
    <button onClick={() => pan("end")} aria-label="Pan board right">→</button>
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
      <li>Ak hráč nekúpi property, ide dražba medzi aktívnymi hráčmi.</li>
      <li>Majetok vieš založiť/odkúpiť späť; založený majetok neberie nájom.</li>
      <li>Trade funguje cez návrh → accept/reject; farebné skupiny s budovami sú locknuté.</li>
      <li>Ak padneš do mínusu, príde debt phase: mortgage/sell/trade alebo bankrot.</li>
      <li>Tax/jail/card poplatky idú do Free Parking potu; kto tam pristane, berie bank.</li>
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



function TurnAssist({ state, legal, busy, act, runBot, autoBots }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number; amount?: number })[]; busy: boolean; act: (a: GameAction) => void; runBot: () => void; autoBots: boolean }) {
  if (state.phase === "finished") return null;
  const viewerTurn = state.canAct && state.turn === state.viewer;
  const primary = legal.find((a) => ["roll", "buy", "bid_auction", "resolve_debt", "end_turn"].includes(a.type)) ?? legal[0];
  const text = state.phase === "auction" ? "Dražba beží — bidni alebo passni." : state.phase === "debt" ? "Debt crisis — zohnať cash alebo bankrot." : state.phase === "buy" ? "Rozhodni: kúpiť alebo poslať do dražby." : state.phase === "roll" ? "Hoď kockami a nechaj kapitalizmus robiť škody." : "Sprav upkeep alebo ukonči ťah.";
  return <section className="card turn-assist">
    <div><span className="label">Table coach</span><strong>{viewerTurn ? "Tvoj move" : `${state.names[state.turn]} je na rade`}</strong><p>{text}</p></div>
    <div className="assist-actions">
      {viewerTurn && primary && <button className={`action-btn action-${primary.type}`} disabled={busy} onClick={() => act(cleanAction(primary))}><span>{actionIcon(primary.type)}</span>{primary.label ?? labelFor(primary.type)}</button>}
      {!viewerTurn && state.turn !== state.viewer && !autoBots && isNpcSeat(state, state.turn) && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Run NPC turn</button>}
      {!viewerTurn && state.turn !== state.viewer && autoBots && <span className="auto-pill">🤖 Auto-bots running</span>}
    </div>
  </section>;
}

function AuctionBanner({ state, legal, busy, act, runBot }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number; amount?: number })[]; busy: boolean; act: (a: GameAction) => void; runBot: () => void }) {
  if (state.phase !== "auction" || !state.auction) return null;
  const space = state.board[state.auction.spaceId];
  const high = state.auction.highBidder;
  const bidActions = legal.filter((a) => a.type === "bid_auction");
  const pass = legal.find((a) => a.type === "pass_auction");
  return <section className="card auction-banner auction-stage">
    <div className="auction-title"><span>🔨</span><div><p className="label">Auction live</p><h2>{space.name}</h2><p>{space.price ? `List price €${space.price}` : "Bank property"} · {space.kind.replace(/_/g, " ")}</p></div></div>
    <div className="auction-meta"><span><b>High bid</b>{high ? `${state.names[high]} · €${state.auction.currentBid}` : "no bids yet"}</span><span><b>Bidders</b>{state.auction.active.map((p) => state.names[p]).join(" · ")}</span></div>
    {state.canAct && <div className="auction-actions">{bidActions.map((a) => <button key={`${a.type}-${a.amount}`} className="action-btn action-bid_auction" disabled={busy} onClick={() => act(cleanAction(a))}>🔨 €{a.amount}</button>)}{pass && <button className="action-btn action-pass_auction" disabled={busy} onClick={() => act(cleanAction(pass))}>✋ Pass</button>}</div>}
    {!state.canAct && state.turn !== state.viewer && isNpcSeat(state, state.turn) && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Run NPC bid/pass</button>}
  </section>;
}


function DebtBanner({ state, legal, busy, act }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number; amount?: number })[]; busy: boolean; act: (a: GameAction) => void }) {
  if (state.phase !== "debt" || !state.debt) return null;
  const creditor = state.debt.creditor;
  const emergency = legal.filter((a) => ["mortgage", "sell_building", "resolve_debt", "declare_bankruptcy"].includes(a.type)).slice(0, 4);
  return <section className="card debt-banner debt-stage">
    <div><span className="label">Debt crisis</span><strong>💥 {state.names[state.debt.player]} owes €{state.debt.amount}</strong></div>
    <div><span className="label">Creditor</span><strong>{creditor ? state.names[creditor] : "Bank"}</strong></div>
    <p>Mortgage, sell buildings, trade for cash, or declare bankruptcy.</p>
    {state.canAct && <div className="debt-actions">{emergency.map((a, idx) => <button key={`${a.type}-${a.spaceId ?? idx}`} className={`action-btn action-${a.type}`} disabled={busy} onClick={() => act(cleanAction(a))}><span>{actionIcon(a.type)}</span>{a.label ?? labelFor(a.type)}</button>)}</div>}
  </section>;
}

function PendingTrade({ state, act, busy }: { state: GameState; act: (a: GameAction) => void; busy: boolean }) {
  const trade = state.pendingTrade;
  if (!trade) return null;
  const from = trade.from_player ?? trade.fromPlayer!;
  const to = trade.to_player ?? trade.toPlayer!;
  const cashFrom = trade.cash_from ?? trade.cashFrom ?? 0;
  const cashTo = trade.cash_to ?? trade.cashTo ?? 0;
  const propsFrom = trade.properties_from ?? trade.propertiesFrom ?? [];
  const propsTo = trade.properties_to ?? trade.propertiesTo ?? [];
  const propertyList = (ids: number[]) => ids.length ? ids.map((id) => state.board[id]?.name ?? `#${id}`).join(" · ") : "nič";
  const iAmRecipient = state.viewer === to;
  const iAmProposer = state.viewer === from;
  return <section className="pending-trade card">
    <p className="label">Pending trade</p>
    <h3>{state.names[from]} ⇄ {state.names[to]}</h3>
    <div className="pending-trade-grid">
      <div><b>{state.names[from]} gives</b><span>{propertyList(propsFrom)} + €{cashFrom}</span></div>
      <div><b>{state.names[to]} gives</b><span>{propertyList(propsTo)} + €{cashTo}</span></div>
    </div>
    {iAmRecipient && <div className="trade-response-actions"><button className="action-btn action-accept_trade" disabled={busy} onClick={() => act({ type: "accept_trade" })}>✅ Accept trade</button><button className="ghost" disabled={busy} onClick={() => act({ type: "reject_trade" })}>✋ Reject</button></div>}
    {iAmProposer && <button className="ghost" disabled={busy} onClick={() => act({ type: "cancel_trade" })}>✕ Cancel proposal</button>}
    {!iAmRecipient && !iAmProposer && <p className="muted">Waiting for response.</p>}
  </section>;
}

function TradeDesk({ state, act, busy }: { state: GameState; act: (a: GameAction) => void; busy: boolean }) {
  const canTrade = state.canAct && (state.phase === "end" || state.phase === "debt") && state.legalActions.some((a) => a.type === "propose_trade");
  const partners = state.players.filter((p) => p !== state.viewer && state.playerState[p].active);
  const [toPlayer, setToPlayer] = useState(partners[0] ?? "");
  const [cashFrom, setCashFrom] = useState(0);
  const [cashTo, setCashTo] = useState(0);
  const [give, setGive] = useState<number[]>([]);
  const [take, setTake] = useState<number[]>([]);
  if (!canTrade || !partners.length) return null;
  const partner = partners.includes(toPlayer) ? toPlayer : partners[0];
  const myProps = Object.entries(state.owners).filter(([, o]) => o === state.viewer).map(([id]) => state.board[Number(id)]).filter((sp) => (state.buildings[String(sp.id)] ?? 0) === 0);
  const theirProps = Object.entries(state.owners).filter(([, o]) => o === partner).map(([id]) => state.board[Number(id)]).filter((sp) => (state.buildings[String(sp.id)] ?? 0) === 0);
  const toggle = (list: number[], id: number) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  return <details className="trade-desk">
    <summary>🤝 Propose trade</summary>
    <label>Partner<select value={partner} onChange={(e) => { setToPlayer(e.target.value); setTake([]); }}>
      {partners.map((p) => <option key={p} value={p}>{state.names[p]}</option>)}
    </select></label>
    <div className="trade-cash"><label>You give €<input type="number" min="0" value={cashFrom} onChange={(e) => setCashFrom(Number(e.target.value || 0))} /></label><label>You get €<input type="number" min="0" value={cashTo} onChange={(e) => setCashTo(Number(e.target.value || 0))} /></label></div>
    <div className="trade-columns"><div><strong>You give</strong>{myProps.length ? myProps.map((sp) => <label key={sp.id}><input type="checkbox" checked={give.includes(sp.id)} onChange={() => setGive(toggle(give, sp.id))} /> {sp.name}{state.mortgaged[String(sp.id)] ? " · mortgaged" : ""}</label>) : <small>No free properties.</small>}</div><div><strong>You get</strong>{theirProps.length ? theirProps.map((sp) => <label key={sp.id}><input type="checkbox" checked={take.includes(sp.id)} onChange={() => setTake(toggle(take, sp.id))} /> {sp.name}{state.mortgaged[String(sp.id)] ? " · mortgaged" : ""}</label>) : <small>No free properties.</small>}</div></div>
    <button className="action-btn action-propose_trade" disabled={busy} onClick={() => act({ type: "propose_trade", toPlayer: partner, cashFrom, cashTo, propertiesFrom: give, propertiesTo: take })}>🤝 Send trade proposal</button>
    <p className="muted">Other player must accept or reject. Improved color groups are locked until houses/hotel are gone.</p>
  </details>;
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
  return ({ roll: "hod", buy: "kúpa", auction: "dražba", debt: "dlh", end: "koniec ťahu", finished: "koniec hry" } as Record<string, string>)[phase] ?? phase;
}

function actionIcon(type: string) {
  return ({ roll: "🎲", buy: "💸", skip_buy: "🔨", end_turn: "✅", pay_jail: "🚔", use_jail_card: "🎟️", build: "🏗️", sell_building: "🏚️", mortgage: "🏦", debt: "💥", debt_resolved: "✅", declare_bankruptcy: "💀", unmortgage: "🔓", bid_auction: "🔨", pass_auction: "✋", propose_trade: "🤝", accept_trade: "✅", reject_trade: "✋", cancel_trade: "✕", trade: "🤝", resolve_debt: "✅" } as Record<string, string>)[type] ?? "👉";
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
  return ({ roll: "🎲", buy: "💸", rent: "🏦", card: "🃏", jail: "🚔", go_to_jail: "🚔", build: "🏗️", sell_building: "🏚️", mortgage: "🏦", debt: "💥", debt_resolved: "✅", declare_bankruptcy: "💀", unmortgage: "🔓", auction: "🔨", auction_bid: "🔨", auction_pass: "✋", auction_win: "🏁", trade: "🤝", finish: "🏆", bankrupt: "💀", go: "💰" } as Record<string, string>)[type] ?? "•";
}

function Board({ state, selectedId, onSelect }: { state: GameState; selectedId: number | null; onSelect: (id: number) => void }) {
  return <div className="classic-board card">
    <div className="board-center">
      <img src="/panda-capital-board-center.png" alt="Panda Capital city board art" />
      <div className="board-logo"><p className="eyebrow">Panda Capital</p><h2>City Board</h2><p>Pass GO €200 · Jail · Auctions · Trades</p></div>
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
  const mortgaged = !!state.mortgaged[String(space.id)];
  return <button type="button" data-space-id={space.id} className={`tile classic-tile ${space.kind} ${selected ? "selected" : ""} ${mortgaged ? "mortgaged" : ""} ${owner ? `owned owned-${owner} ${boardSideClass(space.id)}` : ""} ${buildings > 0 ? "has-buildings" : ""}`} style={tileStyle(space.id)} onClick={() => onSelect(space.id)} aria-label={`Show ${space.name}`}>
    <div className="stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "transparent" }} />
    <span className="tile-id">{space.id}</span><span className="tile-kind-icon">{spaceIcon(space.kind)}</span>
    <strong title={space.name}>{shortTileName(space.name)}</strong>
    {space.price > 0 && <small>€{space.price} · {mortgaged ? "mortgaged" : `rent €${space.currentRent || space.rent || "dice"}`}</small>}
    {buildings > 0 && <small className="houses">{buildings === 5 ? "🏨" : "🏠".repeat(buildings)}</small>}
    {mortgaged && <small className="mortgage-badge">MORTGAGED</small>}
    {owner && <em className={`owner-flag owner-${owner}`}><span>{emojiFor(state, owner)}</span><b>{playerInitials(state.names[owner])}</b></em>}
    {owner && <span className={`owner-pennant owner-${owner}`} title={`Owned by ${state.names[owner]}`}>{playerInitials(state.names[owner])}</span>}
    {owner && <span className={`owner-edge owner-${owner}`} />}
    {buildings > 0 && <BuildingStack count={buildings} />}
    {mortgaged && <span className="mortgage-stamp">M</span>}
    <div className="tokens">{occupants.map((p) => <span key={p}>{emojiFor(state, p)}</span>)}</div>
  </button>;
}

function BuildingStack({ count }: { count: number }) {
  if (count >= 5) return <span className="building-stack hotel"><b>🏨</b></span>;
  return <span className="building-stack houses">{Array.from({ length: count }, (_, i) => <b key={i}>🏠</b>)}</span>;
}

function boardSideClass(id: number) {
  if (id <= 10) return "side-bottom";
  if (id <= 20) return "side-left";
  if (id <= 30) return "side-top";
  return "side-right";
}

function playerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts.map((p) => p[0]).join("") : name.slice(0, 2)).toUpperCase();
}

function shortTileName(name: string) {
  return name
    .replace("Bratislavská", "BA")
    .replace("Povraznícka", "Povr.")
    .replace("železnica", "Rail")
    .replace("agentov", "agent.")
    .replace("bugfixová", "bugfix")
    .replace("radiála", "rad.")
    .replace("nábreežie", "nábr.")
    .replace("nábrežie", "nábr.")
    .replace("vodáreň", "vod.");
}

function DeedCard({ state, space }: { state: GameState; space: Space }) {
  const owner = state.owners[String(space.id)];
  const buildings = state.buildings[String(space.id)] ?? 0;
  const mortgaged = !!state.mortgaged[String(space.id)];
  const occupants = state.players.filter((p) => state.playerState[p].position === space.id);
  return <section className="card deed-card">
    <div className="deed-stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "linear-gradient(135deg,#facc15,#fb923c)" }} />
    <div className="deed-body">
      <p className="eyebrow">Deed / políčko #{space.id}</p>
      <h2>{space.name}</h2>
      <div className="deed-grid">
        <span>Typ <strong>{space.kind.replace(/_/g, " ")}</strong></span>
        {space.price > 0 && <span>Cena <strong>€{space.price}</strong></span>}
        {space.isBuyable && <span>Nájom <strong>{mortgaged ? "€0 · mortgaged" : `€${space.currentRent || space.rent || "dice"}`}</strong></span>}
        {space.isBuyable && <span>Mortgage <strong>€{space.mortgageValue} / back €{space.unmortgageCost}</strong></span>}
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
    <div className="owned">{owned.length ? owned.map((s) => <span key={s.id} className={state.mortgaged[String(s.id)] ? "mortgaged-chip" : ""} style={{ borderColor: s.color ? COLOR[s.color] : undefined }}>{s.name}{state.mortgaged[String(s.id)] ? " · M" : ""}</span>) : <small>No properties yet.</small>}</div>
  </div>;
}

function emojiFor(state: GameState, player: Player) {
  const idx = state.players.indexOf(player);
  return PLAYER_EMOJI[idx] ?? "🎲";
}

function cleanAction(a: GameAction & { label?: string; spaceId?: number; amount?: number }): GameAction {
  if (["build", "sell_building", "mortgage", "unmortgage"].includes(a.type)) return { type: a.type, spaceId: a.spaceId } as GameAction;
  if (a.type === "bid_auction") return { type: "bid_auction", spaceId: a.spaceId, amount: a.amount } as GameAction;
  if (a.type === "pass_auction") return { type: "pass_auction", spaceId: a.spaceId } as GameAction;
  return { type: a.type } as GameAction;
}

function labelFor(type: string) {
  return ({ roll: "🎲 Roll", buy: "Buy", skip_buy: "Skip buy", end_turn: "End turn", pay_jail: "Pay jail", use_jail_card: "Use jail card", build: "Build" } as Record<string, string>)[type] ?? type;
}

createRoot(document.getElementById("root")!).render(<App />);
