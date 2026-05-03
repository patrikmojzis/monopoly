# 09 — Mobile Game Mode

## Problem

Mobile currently works-ish but can become a long scroll of panels. Patrik wants game feel. Phone should not require scrolling past multiple dashboard cards to reach board.

## Goal

Mobile = board-first touch interface with drawers and a bottom action dock.

## Brainstorm

### Mobile screen structure

```text
┌ top mini HUD ┐
│              │
│   BOARD      │  pan/zoom/swipe
│              │
├ bottom dock ─┤ Roll / Buy / End
```

Drawers:

- Cards.
- Trade.
- Log.
- Rules.
- Settings.

### Board navigation

Options:

1. Keep board larger than viewport and pan horizontally/vertically.
2. Add zoom controls: 75%, 100%, tile focus.
3. Auto-center current player/selected tile.

Minimum:

- Board scroll area with visible affordance.
- “Center on me” button.
- Selected/current tile overlay.

### Bottom dock

Only primary actions:

- Roll.
- Buy / Auction / Bid / Pass.
- End turn.
- Debt critical action.

Management actions go into drawers.

### Deed hand bottom sheet

- `Cards` button opens bottom sheet.
- Sheet height 45–80vh.
- Cards scroll horizontally/vertically.

### Avoid sticky collisions

- Only one fixed bottom dock.
- Top HUD fixed or absolute.
- No multiple sticky status panels.

## Concrete implementation notes

- Use CSS `100dvh`, safe-area env vars.
- `.mobile-dock { bottom: env(safe-area-inset-bottom); }`
- Add `body.game-mode-active { overflow:hidden; }` maybe via component effect.
- Use `dialog` or custom fixed drawer.

## Acceptance criteria

- On iPhone screenshot, board appears immediately.
- No tall pre-board stack.
- Primary action always reachable.
- Cards/log/rules accessible but hidden by default.
