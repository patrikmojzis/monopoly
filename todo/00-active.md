# Active TODO Tracker

## Current sprint: Game Mode v2 polish

Status: Game Mode v1 delivered and QA-smoked. Patrik requested a new TODO/planning layer before continuing. Game Mode v2 polish plan added in `20`–`27`: navigation/exit, explicit seat model, token figurines, fullscreen board comfort, animations, sounds, QA/replay.

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
- [x] Phase G: real trades (`07`) — first pass: pending trade proposals, accept/reject/cancel, stale validation, UI pending trade panel
- [x] Phase H: mobile game mode (`09`) — first pass: compact phone HUD, touch board affordance, Me/Sel center controls, bottom-sheet drawers, mobile deed/dock sizing
- [x] Phase I: visual art polish (`10`) — first pass: warm tabletop background, paper tiles, wood board frame, tactile buttons/tokens, physical card tone
- [ ] Phase J: QA/replay (`12`) — superseded by V2 QA checklist before replay
- [ ] V2-A: navigation + exit-to-setup semantics (`21`)
- [ ] V2-B: table setup / human-agent-NPC seat model (`22`)
- [ ] V2-C: token figurines + picker (`23`)
- [ ] V2-D: fullscreen board comfort (`24`)
- [ ] V2-H: board readability and orientation (`28`)
- [ ] V2-E: animation system (`25`)
- [ ] V2-F: sound system (`26`)
- [ ] V2-G: QA/replay readiness (`27`)

## Next action

Read `20-v2-polish-overview.md`, then implement V2-A (`21-navigation-exit.md`) first. Board readability (`28`) is now the core product focus and should be prioritized before decorative polish.

## Last known deployed commit

- `5326d96` — captured live polish feedback; deployed successfully.
- `7bf4e10` — removed duplicate Menu button from bottom action dock; included before feedback-plan commit.

## Current critique of deployed commit

Still feels like a web dashboard because:

- too much above board
- board not truly fullscreen
- auction and legal actions occupy page sections
- player/cards panels still behave like sidebars
- bot controls still conceptually confusing
- not enough motion/life
