# 10 — Visual / Art Direction

## Problem

The game should feel like a polished digital board game. Current art center is strong, but surrounding UI is still dark SaaS/card UI.

## Goal

Unify visuals around warm tabletop + physical cards + Panda Capital city.

## Brainstorm

### Visual mood

- Warm wooden table.
- Soft 3D city board.
- Cream paper tiles.
- Chunky player tokens.
- Deed cards like physical cards.
- Floating HUD glass/paper hybrid.
- Neon panda/city ambience.

### Avoid

- Looking like a crypto/SaaS admin dashboard.
- Too many dark rectangular panels.
- Plain text lists.
- Copying Monopoly branding/trade dress too closely.

### Image generation needs

Potential assets:

1. Center board art (already first pass).
2. Wooden table background.
3. Player token icons/chips.
4. Chance card backs.
5. Community card backs.
6. Auction hammer icon/card.
7. Deed card paper texture.
8. House/hotel mini icons.

### Prompt directions

Keep original:

- Panda Capital.
- Bratislava/Panda Agent universe.
- No Monopoly logo, mascot, exact board text, or official design.

### UI style rules

- Board tiles: high readability over art.
- Cards: serif title, paper texture, color band.
- Buttons: chunky, tactile, strong CTA color.
- HUD: compact and translucent, not huge panels.

## Concrete implementation notes

- Add CSS variables for player colors, paper, table, shadows.
- Use art as board center only, not whole background if it harms readability.
- Add wood/table radial background to game shell.
- Replace generic `.card` for game mode with `.game-panel` variants.

## Acceptance criteria

- Screenshot looks like a digital board game.
- Deed cards feel physical.
- UI is visually cohesive.
- Original/public-safe identity preserved.
