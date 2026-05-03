# Active TODO Tracker

## Current sprint: Game Mode v1

Status: Phase A+B/C/D/E deployed; Phase F animation first pass implemented locally; build/tests passed; commit/deploy/QA next.

## Rules for Clawd

1. Always start by reading this file and the next unchecked TODO.
2. Implement one focused TODO/phase at a time.
3. Run tests/build before committing.
4. Update this tracker after each commit.
5. Do not start replay until deployed and QA-smoked.
6. Keep live game/player tokens out of todo files and commits.

## Ordered queue

- [x] Phase A: fullscreen shell + compact HUD (`01`, `02`) — implemented in local game-mode pass
- [x] Phase B: bot controls cleanup (`03`) — Clawd/real-player buttons hidden; NPC autoplay moved to menu
- [x] Phase C: board readability (`04`) — first pass: bigger owner pennants, owner borders, building stacks, mortgage stamp, larger tokens
- [x] Phase D: player seats + board space (`05`) — first pass: seat cards pulse/turn labeling, no permanent player sidebar
- [x] Phase E: deed hand/cards (`06`) — first pass: grouped physical deed cards, card click selects board tile
- [x] Phase F: animations/game feel (`08`) — first pass: event toast overlays, dice HUD pop, selected tile ring, city breathe, auction/debt/build/mortgage motion
- [ ] Phase G: real trades (`07`)
- [ ] Phase H: mobile game mode (`09`)
- [ ] Phase I: visual art polish (`10`)
- [ ] Phase J: QA/replay (`12`)

## Next action

Commit/deploy Phase F and run visual QA on roll/buy/card/rent event feedback. Then start Phase G: real trades (`07`).

## Last known deployed commit

- `3bf8e97` — physical deed cards, grouped deed hand, seat-card polish.

## Current critique of deployed commit

Still feels like a web dashboard because:

- too much above board
- board not truly fullscreen
- auction and legal actions occupy page sections
- player/cards panels still behave like sidebars
- bot controls still conceptually confusing
- not enough motion/life
