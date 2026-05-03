# 05 — Player Seats / Board Space

## Problem

Sidebar with players/actions/deeds consumes board space and makes layout feel like a web dashboard. Patrik suggested player name + sum could be above board so board is larger.

## Goal

Represent players as table seats around the board. Keep board large. Use sidebars only as temporary drawers.

## Brainstorm

### Seat card contents

Always visible:

- Avatar/token.
- Name.
- Cash.
- Position.
- Deed count.
- Turn indicator.

Optional/expanded:

- Net worth.
- Jail status.
- Jail card count.
- Color set completion.

### Layout options

#### 2-player game

```text
Patrik seat                         Clawd seat

              BOARD
```

#### 4-player game

```text
        Seat 3
Seat 1  BOARD  Seat 2
        Seat 4
```

But responsive CSS can be hard. Simpler:

- Desktop: horizontal seat rail above board.
- Wide desktop: allow seats at left/right edges later.
- Mobile: horizontal scrollable seat rail.

### Active turn feeling

- Active seat glows.
- Token pulses.
- If viewer seat: “YOU” marker.
- If opponent: “Waiting” or “Clawd thinking…”

### Board space strategy

- Do not permanently reserve a right sidebar.
- Deed card overlay floats or drawer opens when selected.
- Legal actions dock is bottom overlay, not sidebar.

## Concrete implementation notes

- Replace `PlayerPanel` default display with compact `SeatCard`.
- Move `PlayerPanel` into details drawer.
- Side panels should use `position:absolute/fixed` overlay, not grid column consuming board width.
- For desktop, let board use `min(100vh - hud, 100vw - margins)`.

## Acceptance criteria

- Board is larger after removing permanent sidebar.
- Player cash/turn still visible.
- Full player details accessible but not always stealing space.
