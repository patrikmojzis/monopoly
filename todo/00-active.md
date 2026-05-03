# Active TODO Tracker

## Current sprint: Game Mode v1

Status: planning complete, implementation next.

## Rules for Clawd

1. Always start by reading this file and the next unchecked TODO.
2. Implement one focused TODO/phase at a time.
3. Run tests/build before committing.
4. Update this tracker after each commit.
5. Do not start replay until deployed and QA-smoked.
6. Keep live game/player tokens out of todo files and commits.

## Ordered queue

- [ ] Phase A: fullscreen shell + compact HUD (`01`, `02`)
- [ ] Phase B: bot controls cleanup (`03`)
- [ ] Phase C: board readability (`04`)
- [ ] Phase D: player seats + board space (`05`)
- [ ] Phase E: deed hand/cards (`06`)
- [ ] Phase F: animations/game feel (`08`)
- [ ] Phase G: real trades (`07`)
- [ ] Phase H: mobile game mode (`09`)
- [ ] Phase I: visual art polish (`10`)
- [ ] Phase J: QA/replay (`12`)

## Next action

Start Phase A+B together only where they touch the same layout surface:

- create fullscreen `GameMode` shell
- compress top HUD
- move log/rules/invites/settings into drawers or hidden panels
- remove confusing bot buttons for 1v1
- keep board visible immediately

## Last known deployed commit

- `04674a1` — first board-first pass with city art, seat cards, deed hand, ownership flags.

## Current critique of deployed commit

Still feels like a web dashboard because:

- too much above board
- board not truly fullscreen
- auction and legal actions occupy page sections
- player/cards panels still behave like sidebars
- bot controls still conceptually confusing
- not enough motion/life
