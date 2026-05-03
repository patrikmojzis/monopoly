# 04 — Board Readability

## Problem

Patrik cannot easily read from the board who owns which property or which buildings exist. Current flags are present but too small and the tile information is still text-heavy.

## Goal

The board must communicate state at a glance without opening sidebars.

## Brainstorm

### Tile layers

Each tile should have these visual layers:

1. Color stripe / group identity.
2. Owner banner / flag.
3. Building stack / hotel icon.
4. Mortgage stamp.
5. Player token(s).
6. Price/rent micro info.
7. Selection/landing pulse.

### Owner visual language

Use consistent player colors:

- Patrik: gold/yellow.
- Clawd: blue/cyan.
- Luna: purple.
- Angelina: pink/green? Need fixed palette.

Owner markers should be on board edge like PC Monopoly screenshots: large colored pennants/flags outside or overlapping tile edges.

Ideas:

- Small triangular flag protrudes outside board edge.
- Bottom ribbon on tile with player emoji + initials.
- Full tile border in owner color.
- Tiny avatar token next to property name.

Best likely: **owner pennant + colored bottom border + avatar.**

### Buildings

Current emoji houses can be too tiny.

Options:

- Use CSS 3D mini houses: green rounded rectangles with roof triangle.
- Use emoji larger, but consistent sizing.
- Show building count pill: `🏠×3`, hotel `🏨`.
- On tile itself, show vertical stack if enough space.

Best likely: desktop shows individual houses, mobile/tight tiles show `×N`.

### Mortgage

Mortgage should visually dominate:

- Greyscale tile.
- Diagonal red/gray `MORTGAGED` stamp.
- Rent hidden/€0.
- Owner still visible but muted.

### Tokens

Tokens should feel like pieces:

- Bigger circular chips.
- Slight bob/glow on active player.
- If multiple occupants, fan out.
- On movement, animate along tiles if possible.

### Tile text reduction

Tile can show:

- Shortened name.
- rent or price.
- owner/building state.

Full details in deed overlay/card.

## Concrete implementation notes

- Add `ownerColor(player)` helper in React.
- Add `shortName()` for tile labels; full name in deed card.
- Compute board side/corner to position owner pennants outward.
- Add classes like `.tile.owned-by-p1`, `.tile.has-buildings`, `.tile.mortgaged`.
- Add `BuildingStack` component.
- Add `PlayerTokenStack` component.

## Acceptance criteria

- In a screenshot, user can identify Patrik vs Clawd properties without zooming side panel.
- Buildings/hotels visible directly on board.
- Mortgaged property visually obvious.
- Current/selected/landing tile visible instantly.
