# V2-E — Animation system

## Problem

The game still lacks physical motion. Web can absolutely handle this; the constraint is product discipline, not technology.

## Animation priorities

1. Moving token after roll
   - token travels/hops from old tile to new tile
   - destination token should not duplicate weirdly during animation
   - works even across GO/corners
2. Dice roll overlay
   - dice roll moment before result
   - can start with CSS/WebAudio; later image-gen dice sprite sheet possible
3. Money/rent flyouts
   - buy: money leaves player / bank receives
   - rent: money flies from payer to owner
4. Card reveal
   - Chance / Community card flips in center
5. Turn spotlight
   - current player seat gets spotlight pulse

## Technical approach

- Use CSS/DOM overlays first, not canvas.
- Use GameState version/history to detect events.
- Store previous positions in React ref for movement animation.
- Keep animations cosmetic; never block engine state.
- Respect `prefers-reduced-motion`.

## Existing WIP note

A local git stash exists named `wip moving-token animation before v2 planning`. It contains a first pass token-flight overlay that passed tests/build once but was intentionally parked because Patrik asked for a new plan before continuing.

When implementing V2-E, inspect/pop that stash only if still useful; do not blindly ship it without QA.

## QA

- Roll once: token visibly moves from previous tile to result tile.
- Token does not leave duplicate grey artifacts.
- Movement works for current player and other player/bot/agent turns.
- Reduced motion disables travel animation cleanly.
