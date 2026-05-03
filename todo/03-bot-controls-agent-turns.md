# 03 — Bot Controls / Agent Turns

## Problem

Patrik accidentally clicked **Bot manual** because he thought it might be documentation or a copy/manual feature. `Let Clawd play` is also confusing: does it make Clawd act? Is Clawd a bot? Is this a real opponent? In a 1v1 Patrik-vs-Clawd game, Patrik should never need to press a button to make Clawd play.

## Goal

Remove ambiguous bot controls from human-vs-agent games. Use one clear NPC autoplay concept only when the game actually has bots/NPC seats.

## Brainstorm

### Terminology

Bad:

- Bot manual
- Let Clawd play
- Bot turn

Better:

- Auto-play NPCs: ON/OFF
- NPC turns: manual/auto
- Settings > NPC autoplay

But if game is Patrik vs Clawd agent, Clawd is not an in-browser bot. Clawd acts via API outside the browser. So no button.

### Player type model

Current game probably only stores names/tokens. Better public state could include:

```ts
playerKind: {
  p1: "human",
  p2: "agent",
  p3: "npc",
  p4: "npc"
}
```

For now infer by names only is fragile. Better backend creation accepts player objects later:

```json
{"players":[{"name":"Patrik","kind":"human"},{"name":"Clawd","kind":"agent"},{"name":"Luna","kind":"npc"}]}
```

### Browser UI behavior

- If current turn belongs to viewer: show primary actions.
- If current turn is non-viewer human/agent: show “Waiting for Clawd…” not action button.
- If current turn is NPC and autoplay off: show one controlled action in settings or prompt: “Run NPC turn”.
- If autoplay on: show “NPC autoplay running”.

### Clawd external loop

For Patrik vs Clawd:

- Browser says “Waiting for Clawd”.
- Clawd uses `/wait` + `/actions` from Telegram/API loop.
- Patrik never sees Clawd token or Clawd turn button.

## Concrete implementation notes

- Add helper `isNpcSeat(state, player)` eventually.
- Short-term: hide `runBot` button unless player count > 2 or name is known NPC (`Angelina`, `Luna`, etc.).
- Rename header button to Settings > Auto-play NPCs.
- Remove auto button from top chrome; put it into settings drawer.
- Avoid persisting confusing `panda-capital-autobots` UX in top-level visible place.

## Acceptance criteria

- No visible “Bot manual”.
- No visible “Let Clawd play” in Patrik-vs-Clawd games.
- If Clawd’s turn, UI says “Waiting for Clawd”.
- If NPCs exist, there is exactly one NPC autoplay setting.
- Patrik cannot accidentally play the opponent seat from UI confusion.
