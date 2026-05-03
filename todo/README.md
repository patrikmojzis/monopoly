# Panda Capital Game Mode TODO

Source of truth for turning Panda Capital from a web dashboard into a fullscreen digital board game.

Patrik feedback driving this folder:

- Accidentally clicked **Bot manual** because it looked like documentation/copy, but it was an action button.
- Too much UI above the board; it should be compact or moved lower/into drawers.
- **Let Clawd play** button is confusing; should be one clear Auto-play ON/OFF concept, and only when bots/NPCs exist.
- Board does not clearly show who owns which card/property/building.
- Trades should be real propose/accept/reject flows, not trusted instant transfer.
- Owned properties should look like real deed cards, not headings/text lists.
- Sidebar with name/cash consumes board space; player info should become table-seat HUD around the board.
- Missing animations/life: game feels like click dice + click next round.
- Make it fullscreen; board should feel like a game, not a website.

## File map

1. `01-fullscreen-game-shell.md` — full-screen canvas and layout philosophy.
2. `02-top-hud-information-architecture.md` — compact top HUD and drawer strategy.
3. `03-bot-controls-agent-turns.md` — remove confusing bot buttons and define NPC autoplay.
4. `04-board-readability.md` — ownership, buildings, mortgage, tokens, tile information.
5. `05-player-seats-and-board-space.md` — replace sidebar with table seats.
6. `06-deed-cards-and-hand.md` — visual property cards / hand / set grouping.
7. `07-real-trades.md` — pending trade backend + UI design.
8. `08-animations-and-game-feel.md` — dice, token movement, payment, card reveal, ambient motion.
9. `09-mobile-game-mode.md` — phone/tablet UX plan.
10. `10-visual-art-direction.md` — art/UI direction and image-gen prompts.
11. `11-implementation-roadmap.md` — build phases and acceptance criteria.
12. `12-qa-checklist.md` — deploy/browser/mobile/replay QA.

## Product north star

When a player opens the page, first impression should be:

> “I am sitting at a digital board-game table.”

Not:

> “I am using a web app that renders a board component.”


## Game Mode v2 polish plan

- `20-v2-polish-overview.md` — v2 goals, phase order, live feedback synthesis.
- `21-navigation-exit.md` — exit-to-setup semantics and menu navigation cleanup.
- `22-table-setup-seat-model.md` — explicit human/agent/NPC seat setup.
- `23-token-figurines-and-picker.md` — token picker and figurine/chip rendering.
- `24-fullscreen-board-comfort.md` — board focus and true fullscreen comfort.
- `25-animation-system.md` — moving tokens, dice, money, cards, turn spotlight.
- `26-sound-system.md` — optional sound layer.
- `27-v2-qa-replay.md` — QA and replay-readiness checklist.
- `28-board-readability-v2.md` — board readability/orientation: tile hierarchy, tokens, owner/building clarity, selected/landing state.
- `29-reference-ui-patterns.md` — research patterns from Monopoly/RichUp-style UI: center-board actions, rotated side tiles, setup/token choices, mobile board-first.
