# 08 — Animations / Game Feel

## Problem

The game feels static: click dice, click next turn. Patrik wants movement and life.

## Goal

Add lightweight but meaningful animations that communicate state changes and create board-game feel.

## Brainstorm

### Dice animation

When roll starts:

- Dice shake/rotate for 500–800ms.
- Final dice values pop.
- Optional sound later (probably off by default).

Technical:

- Client can detect `lastRoll` change by version/history.
- Maintain previous state in React.
- CSS class `.dice-rolling` on action click until response returns.

### Token movement

Ideal: animate from old position to new position step-by-step.

Hard because server returns final state only. Options:

1. Client stores previous positions; if new position differs and history has roll, animate through intermediate tile IDs.
2. Simpler first pass: old tile fades, new tile pulse/bob.
3. Better: token is absolutely positioned over board using tile grid coordinates, then CSS transition to new coordinates.

Phase order:

- v1: landing pulse + token bob.
- v2: absolute token overlay with smooth movement.

### Payment/rent flyouts

When history contains rent/payment:

- parse amount and players if possible.
- show `-€22` red near payer seat and `+€22` green near receiver.
- Fly toward receiver seat.

Short-term: generic toast/flyout near HUD.

### Card reveal

Chance/Community:

- overlay flips card.
- show card message.
- close after delay or click.

### Auction feel

- Hammer icon slam animation.
- Bid buttons pulse on active bidder.
- High bid number counts up.

### Build/mortgage/trade effects

- House pops onto tile.
- Mortgage stamp slams diagonally.
- Trade cards slide between seats.

### Ambient life

- Center city art slight glow/pulse.
- Panda neon glow.
- Subtle dice sparkle.
- Avoid overdoing CPU/mobile drain.

## Concrete implementation notes

- Add `usePrevious(state)` hook.
- Add `GameEffects` component that watches `state.version`/history and renders temporary overlays.
- Use CSS animations first; no heavy animation library unless needed.
- Respect `prefers-reduced-motion`.

## Acceptance criteria

- Roll produces visible dice motion.
- Landing is obvious.
- Rent/payment is visible without reading log.
- Chance/Community feels like drawing a card.
- Animations enhance clarity, not just decoration.
