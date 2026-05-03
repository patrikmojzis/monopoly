# 11 — Implementation Roadmap

## Phase A — Fullscreen shell + information architecture

Tasks:

- Create `GameModeShell` layout.
- Move page from scroll document to viewport table.
- Replace top status stack with compact HUD.
- Move log/rules/invites/settings into drawers.
- Remove permanent right sidebar.
- Ensure board visible immediately.

Risk:

- CSS regressions on mobile.
- Existing components assume document flow.

Test:

- Build.
- Desktop screenshot 1280×720.
- Mobile screenshot / browser viewport.

## Phase B — Bot controls cleanup

Tasks:

- Hide all bot/manual buttons in 1v1 Patrik vs Clawd.
- Move NPC autoplay to settings drawer.
- Add waiting copy for non-viewer turn.
- Consider backend/player-kind model.

Risk:

- Solo QA with NPCs could lose easy control if hidden too hard.

Test:

- 2-player Patrik/Clawd: no bot buttons.
- 4-player with NPC names: settings has Auto-play NPCs.

## Phase C — Board readability

Tasks:

- Bigger owner pennants/flags.
- Owner-colored tile borders.
- Bigger token chips.
- Building/hotel component.
- Mortgage stamp.
- Selected/landing/current tile pulse.

Risk:

- Tile overcrowding on small board.

Test:

- Midgame with many owned properties screenshot.
- Verify owner/building/mortgage readable without side panel.

## Phase D — Deed hand/cards

Tasks:

- Proper bottom/right deed hand.
- Physical mini deed cards.
- Group by color.
- Click card highlights board tile.
- Full deed overlay.

Risk:

- Too much screen space if hand always open.

Test:

- Owned 0, 3, 10+ cards states.
- Mobile bottom sheet.

## Phase E — Animations/effects

Tasks:

- Dice roll animation.
- Landing pulse.
- Payment/rent flyouts.
- Chance/Community card reveal.
- Auction hammer pulse.
- House build pop.
- Reduced-motion support.

Risk:

- Animations desync with server state.
- Over-animation becomes noise.

Test:

- Roll, rent, card, auction, buy/build flows.

## Phase F — Real trades

Tasks:

- Backend pending_trade dataclass and migration.
- Actions: propose/accept/reject/cancel.
- Public state/types.
- Trade modal with card selection.
- Tests.

Risk:

- Trade validation complexity.
- Stale proposals.

Test:

- Unit tests + API smoke.
- Human/agent trade scenario.

## Phase G — Replay and polish

Tasks:

- Deploy.
- Browser QA.
- Fresh 1v1 replay.
- Capture Patrik feedback.
- Iterate.

## Definition of Done for the next big commit

Minimum useful `game-mode` commit should include:

- Fullscreen shell.
- Compact HUD.
- Removed confusing bot buttons for 1v1.
- Board larger.
- Secondary panels in drawers/collapsibles.
- Stronger owner/building/mortgage visuals.
- Basic dice/landing animation.

Real trades can be a second commit if needed because backend/API work is bigger.
