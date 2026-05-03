# 06 — Deed Cards / Player Hand

## Problem

Patrik wants owned properties to look like real cards, not text headings. Current mini deed cards are a first step but still feel like a side panel/list.

## Goal

Create a proper “hand of deed cards” that feels physical and game-like.

## Brainstorm

### Deed card visual anatomy

- Colored group band at top.
- Property name in bold serif.
- Rent row.
- Mortgage value.
- Building cost if applicable.
- Owner avatar.
- Icons for houses/hotel/mortgage.

### Hand behavior

- Desktop: bottom tray with horizontally scrollable cards, like a card hand.
- Mobile: bottom sheet drawer (`Cards`) slides up.
- Clicking card:
  - selects card
  - highlights board tile
  - opens full deed details
  - shows contextual actions (mortgage/build/sell/trade)

### Grouping

- Group by color sets.
- If full set owned, glow group / “set complete”.
- If buildable, show green build affordance.
- If mortgaged, grey stamp.

### Trade integration

Same deed cards can be selectable in trade modal.

### Card density

For many properties, use fan/stack:

- collapsed groups: “Yellow set 2/3”.
- expand on click.

## Concrete implementation notes

- Create `DeedHand` component with `selectedDeedId` state.
- Create reusable `DeedMiniCard` and `DeedFullCard`.
- Add CSS physical card styling: paper texture, drop shadows, hover lift.
- Use `button` semantics for cards.
- Current `DeedCard` can become full detail overlay.

## Acceptance criteria

- Owned properties look like actual cards.
- User can tell color group and rent from hand.
- Clicking a card connects it to board.
- Hand does not permanently reduce board size.
