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
  const [autoBots, setAutoBots] = useState(() => localStorage.getItem("panda-capital-autobots") === "1");

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
  useEffect(() => { localStorage.setItem("panda-capital-autobots", autoBots ? "1" : "0"); }, [autoBots]);
  useEffect(() => {
    if (!autoBots || !state || busy || state.phase === "finished" || state.turn === state.viewer) return;
    const id = window.setTimeout(() => { runBot(); }, 900);
    return () => window.clearTimeout(id);
  }, [autoBots, busy, state?.turn, state?.phase, state?.version]);

  const legal = useMemo(() => state?.legalActions ?? [], [state]);
  const buttonActions = legal.filter((a) => a.type !== "trade");
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
        <button className={`ghost ${autoBots ? "lit" : ""}`} onClick={() => setAutoBots(!autoBots)} disabled={busy}>{autoBots ? "🤖 Auto" : "Bot manual"}</button>
      </div>
    </header>

    {created && <InvitePanel created={created} state={state} />}

    <section className="status-card">
      <div><span className="label">Turn</span><strong>{emojiFor(state, state.turn)} {state.names[state.turn]}</strong></div>
      <div><span className="label">Phase</span><strong>{phaseLabel(state.phase)}</strong></div>
      <div><span className="label">Roll</span><strong>{state.lastRoll ? `${state.lastRoll[0]} + ${state.lastRoll[1]}` : "—"}</strong></div>
      <div><span className="label">Dbl</span><strong>{state.doublesInRow || "—"}</strong></div>
      <div><span className="label">Parking</span><strong>€{state.freeParkingPot}</strong></div>
      {state.winner && <div className="winner">🏆 {state.names[state.winner]} wins</div>}
    </section>

    <TurnBanner state={state} />
    <TurnAssist state={state} legal={buttonActions} busy={busy} act={act} runBot={runBot} autoBots={autoBots} />
    <AuctionBanner state={state} legal={buttonActions} busy={busy} act={act} runBot={runBot} />
    <DebtBanner state={state} legal={buttonActions} busy={busy} act={act} />
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
          {buttonActions.length ? buttonActions.map((a, idx) => <button className={`action-btn action-${a.type}`} key={`${a.type}-${a.spaceId ?? "x"}-${a.amount ?? idx}`} onClick={() => act(cleanAction(a))} disabled={busy || !state.canAct}><span>{actionIcon(a.type)}</span>{a.label ?? labelFor(a.type)}</button>) : <p className="muted">No actions for this token right now.</p>}
          <TradeDesk state={state} act={act} busy={busy} />
          {state.turn !== state.viewer && state.phase !== "finished" && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Let {state.names[state.turn]} play</button>}
          {error && <p className="error">{error}</p>}
        </div>
      </aside>
    </section>

    <section className="card history"><h2>Latest log</h2>{[...state.history].reverse().slice(0, 14).map((h, i) => <p key={i}><span>{eventIcon(String(h.type ?? ""))}</span>{h.message ?? JSON.stringify(h)}</p>)}</section>
    <MobileActionDock state={state} legal={buttonActions} busy={busy} act={act} runBot={runBot} autoBots={autoBots} />
  </main>;
}

function MobileActionDock({ state, legal, busy, act, runBot, autoBots }: { state: GameState; legal: (GameAction & { label?: string; spaceId?: number; amount?: number })[]; busy: boolean; act: (a: GameAction) => void; runBot: () => void; autoBots: boolean }) {
  if (state.phase === "finished") return null;
  const latest = state.history[state.history.length - 1]?.message;
  const viewerTurn = state.turn === state.viewer && state.canAct;
  const primary = (state.phase === "debt" ? legal : legal.filter((a) => !["mortgage", "unmortgage", "build", "sell_building", "trade"].includes(a.type))).slice(0, 2);
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
      <li>Ak hráč nekúpi property, ide dražba medzi aktívnymi hráčmi.</li>
      <li>Majetok vieš založiť/odkúpiť späť; založený majetok neberie nájom.</li>
      <li>Trade desk umožní cash/property transfery bez budov na skupine.</li>
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
      {!viewerTurn && state.turn !== state.viewer && !autoBots && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Let {state.names[state.turn]} play</button>}
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
    {!state.canAct && state.turn !== state.viewer && <button className="ghost bot-button" onClick={runBot} disabled={busy}>🤖 Let {state.names[state.turn]} bid/pass</button>}
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

function TradeDesk({ state, act, busy }: { state: GameState; act: (a: GameAction) => void; busy: boolean }) {
  const canTrade = state.canAct && (state.phase === "end" || state.phase === "debt") && state.legalActions.some((a) => a.type === "trade");
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
    <summary>🤝 Trade / transfer desk</summary>
    <label>Partner<select value={partner} onChange={(e) => { setToPlayer(e.target.value); setTake([]); }}>
      {partners.map((p) => <option key={p} value={p}>{state.names[p]}</option>)}
    </select></label>
    <div className="trade-cash"><label>You give €<input type="number" min="0" value={cashFrom} onChange={(e) => setCashFrom(Number(e.target.value || 0))} /></label><label>You get €<input type="number" min="0" value={cashTo} onChange={(e) => setCashTo(Number(e.target.value || 0))} /></label></div>
    <div className="trade-columns"><div><strong>You give</strong>{myProps.length ? myProps.map((sp) => <label key={sp.id}><input type="checkbox" checked={give.includes(sp.id)} onChange={() => setGive(toggle(give, sp.id))} /> {sp.name}{state.mortgaged[String(sp.id)] ? " · mortgaged" : ""}</label>) : <small>No free properties.</small>}</div><div><strong>You get</strong>{theirProps.length ? theirProps.map((sp) => <label key={sp.id}><input type="checkbox" checked={take.includes(sp.id)} onChange={() => setTake(toggle(take, sp.id))} /> {sp.name}{state.mortgaged[String(sp.id)] ? " · mortgaged" : ""}</label>) : <small>No free properties.</small>}</div></div>
    <button className="action-btn action-trade" disabled={busy} onClick={() => act({ type: "trade", toPlayer: partner, cashFrom, cashTo, propertiesFrom: give, propertiesTo: take })}>🤝 Execute agreed trade</button>
    <p className="muted">Table-trust mode: trade executes immediately. Improved color groups are locked until houses/hotel are gone.</p>
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
  return ({ roll: "🎲", buy: "💸", skip_buy: "🔨", end_turn: "✅", pay_jail: "🚔", use_jail_card: "🎟️", build: "🏗️", sell_building: "🏚️", mortgage: "🏦", debt: "💥", debt_resolved: "✅", declare_bankruptcy: "💀", unmortgage: "🔓", bid_auction: "🔨", pass_auction: "✋", trade: "🤝", resolve_debt: "✅" } as Record<string, string>)[type] ?? "👉";
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
  const mortgaged = !!state.mortgaged[String(space.id)];
  return <button type="button" className={`tile classic-tile ${space.kind} ${selected ? "selected" : ""} ${mortgaged ? "mortgaged" : ""}`} style={tileStyle(space.id)} onClick={() => onSelect(space.id)} aria-label={`Show ${space.name}`}>
    <div className="stripe" style={{ background: space.color ? COLOR[space.color] ?? "#334155" : "transparent" }} />
    <span className="tile-id">{space.id}</span><span className="tile-kind-icon">{spaceIcon(space.kind)}</span>
    <strong title={space.name}>{space.name}</strong>
    {space.price > 0 && <small>€{space.price} · {mortgaged ? "mortgaged" : `rent €${space.currentRent || space.rent || "dice"}`}</small>}
    {buildings > 0 && <small className="houses">{buildings === 5 ? "🏨" : "🏠".repeat(buildings)}</small>}
    {mortgaged && <small className="mortgage-badge">MORTGAGED</small>}
    {owner && <em>{state.names[owner]}</em>}
    <div className="tokens">{occupants.map((p) => <span key={p}>{emojiFor(state, p)}</span>)}</div>
  </button>;
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
