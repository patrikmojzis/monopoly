# 02 — Top HUD / Information Architecture

## Problem

Too many things above the board:

- Header title
- Refresh/New table/Auto button
- Status card row
- Seat cards
- Turn banner
- Table coach
- Auction/debt panels

This creates the feeling that the board is content below a webpage, not the main game.

## Goal

Compress the top into a game HUD and move secondary information into drawers/modals.

## Brainstorm

### What must always be visible?

Only:

- Whose turn.
- Current phase in plain language.
- My cash.
- Last roll / dice.
- Primary action available.
- Maybe free parking pot if relevant.

### What can be hidden behind drawers?

- Rules.
- Full log.
- Invite links.
- Player detail stats.
- Group tracker.
- Legal actions list.
- Settings.

### HUD concept

```text
[Panda Capital] [Patrik €706] [Turn: Patrik · Auction] [Roll 2+4] [Menu]
```

Or even more game-like:

- Left: current player badge.
- Center: dice/current phase.
- Right: buttons for Log, Cards, Trade, Settings.

### Auction/debt handling

Auction should not be a huge block above board. Options:

1. Floating modal over board lower third.
2. Left-side overlay card.
3. Bottom action tray with auction context.

Debt likewise: dramatic overlay, not page section.

## Concrete implementation notes

- Replace `.status-card` with `HudBar`.
- Replace `TurnBanner` + `TurnAssist` stack with `ActionPrompt` anchored near action dock.
- Convert `AuctionBanner` into `AuctionOverlay`.
- Convert `DebtBanner` into `DebtOverlay`.
- Convert invite panel to `MenuDrawer > Invite links`.

## Acceptance criteria

- Above board uses max ~80px desktop, ~56px mobile.
- No duplicate messaging: no TurnBanner + Coach saying same thing.
- Auction/debt controls are visible when needed, but board remains present.
- Fresh game screen does not show invite links unless explicitly opened.
