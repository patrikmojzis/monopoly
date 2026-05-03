# V2-B — Table setup and seat model

## Problem

Current setup only collects names. Bot/agent/human role is inferred by name (`Luna`, `Angelina`, `bot`, `npc`). That is a hack.

Patrik asked: “ako si vyberiem koľko botov chcem v hre a koľko ľudí (agentov)?”

## Desired setup screen

A proper “Create table” screen with 2–4 seats.

### Seat fields

Each seat has:

- seat enabled / disabled via player count 2, 3, 4
- display name
- seat type:
  - Human link
  - Agent
  - NPC bot
- token/avatar choice (implemented in V2-C)

### Suggested defaults

2-player default:

- Patrik — Human link
- Clawd — Agent

Optional 3/4:

- Luna — NPC bot
- Angelina — NPC bot

But these appear only after choosing 3/4 or adding seats.

## Backend model

Current API likely only accepts player names. V2 should add metadata without breaking old clients.

Possible request shape:

```json
{
  "players": [
    { "name": "Patrik", "kind": "human", "token": "🧑‍💻" },
    { "name": "Clawd", "kind": "agent", "token": "🐼" },
    { "name": "Luna", "kind": "npc", "token": "🌙" }
  ]
}
```

Compatibility:

- accept old `string[]` names during transition
- store `playerKinds` / `playerTokens` in game state
- expose in `GameState`

## Bot/autoplay rules

- Only `kind === "npc"` seats are eligible for browser auto-play.
- `kind === "agent"` seats are external/API controlled and should never show “run bot” buttons.
- `kind === "human"` seats use invite/browser links.

## QA

- Create 2-player Human+Agent game; no NPC autoplay toggle.
- Create Human+Agent+NPC; NPC autoplay toggle appears.
- Agent seat does not get bot button.
- Invite links still work.
- Existing old create API shape still works.
