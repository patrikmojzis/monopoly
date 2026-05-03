# V2-I — Reference UI patterns from Monopoly/RichUp-style games

## Why this exists

Patrik asked for research into original/digital Monopoly screenshots on PC and mobile, plus RichUp-style browser UI. This file extracts patterns, not artwork/trade dress.

**Legal/product rule:** do not copy Monopoly branding, board trade dress, mascots, exact tile names, or protected look. Use only generic UX/game-feel patterns: camera, layout, hierarchy, controls, animation, and readability.

## Sources / references checked

- Patrik screenshot of RichUp desktop gameplay: center dice/status/log inside board, side panels outside board, rotated side tiles.
- Marmalade official MONOPOLY mobile/press pages:
  - `https://www.marmaladegamestudio.com/games/monopoly/`
  - `https://www.marmaladegamestudio.com/press-kits/monopoly/`
  - claims: mobile/tablet, animated 3D city, effortless interactive mobile experience, pick mode/board/dice/token.
- Google Play MONOPOLY app listing:
  - `https://play.google.com/store/apps/details?id=com.marmalade.monopoly&hl=en_GB`
  - claims: smooth animations, catchy soundtrack, pick mode/board/dice/token.
- Steam / Ubisoft NEW MONOPOLY page:
  - `https://store.steampowered.com/app/2929170/MONOPOLY/`
  - claims: detailed animated 3D city, move around board to explore neighborhoods, tabletop feel, manipulate token, jumps, custom dice/tokens.
- Browser research subagent attempted deeper screenshot pass but terminated. Do not depend on it; this file is enough to guide next design pass.

## Pattern 1 — Center-board action stage

RichUp screenshot shows the center of the board as the primary action/status area:

- large dice in center
- current turn text under dice
- small recent event log below
- player eyes stay on board during actions

### Panda Capital adaptation

The center city art should become an interactive table surface:

- dice / roll action appears in board center when rolling
- prompt appears in center: `Patrik, buy Trnavské mýto?`
- primary buttons can live in center for the current decision:
  - Roll
  - Buy
  - Auction
  - End turn
  - Accept/reject trade maybe as modal/card
- bottom dock becomes secondary:
  - Cards
  - Trade
  - Log
  - maybe Settings/Menu

### Why

This reduces “web dashboard” feeling and makes the board itself feel alive.

## Pattern 2 — Rotated side tiles

Patrik noticed RichUp side tiles are rotated according to their board side, not all upright.

### Panda Capital adaptation

Side rows should orient like a physical board:

- bottom row text faces player normally
- left row text rotates 90°
- top row flips/rotates appropriately
- right row rotates the other direction

Need to test readability. Rotation improves physical board feel but can hurt scanning. If full rotation is too much, use hybrid:

- keep name horizontal in selected/deed panel
- rotate only stripe/price/owner badge or use vertical writing for side tiles
- board focus/zoom makes rotated text easier

### QA

At 1280×720, can player still read tile names on every side? If not, use partial rotation.

## Pattern 3 — Board as camera/scene, not page section

Official digital Monopoly pages emphasize animated 3D city / board comes to life / tabletop feel.

### Panda Capital adaptation

Even in 2D CSS, treat board as a scene:

- center city art is stage
- dice and token movement happen on top of board
- selected tile pulse is visible on board
- action state appears near where event happened
- side chrome floats over/around board, not in separate dashboard blocks

## Pattern 4 — Pick mode / board / dice / token before play

Mobile listing explicitly frames setup as:

1. press play
2. pick mode, board, dice, token
3. roll dice and move

### Panda Capital adaptation

Setup should become a game lobby, not a name form:

- choose player count: 2/3/4
- each seat type: Human link / Agent / NPC bot
- choose token/avatar per seat
- later choose board theme maybe
- sound/animation toggles optional

This directly maps to `22-table-setup-seat-model.md` and `23-token-figurines-and-picker.md`.

## Pattern 5 — Tokens and dice are collectible/physical objects

Official pages emphasize custom dice/tokens and manipulating tokens.

### Panda Capital adaptation

Tokens/dice deserve dedicated visual treatment:

- dice are big, animated, central
- tokens are 3D-ish chips/figurines with base/shadow
- each player token has color + emoji/avatar
- token movement hops, lands, pulses
- optional image-gen token sheet later

This is not decoration; it improves orientation.

## Pattern 6 — Mobile needs focus, not miniaturized desktop

Mobile official game is marketed as “effortless interactive mobile experience.” That means not just shrinking all panels.

### Panda Capital adaptation

For phone:

- board-first viewport
- center-stage prompt/action overlay
- bottom sheet for details/cards/trade
- minimal top HUD
- big touch targets
- pan/zoom controls always reachable
- selected tile detail in bottom popover

Avoid permanent sidebars on mobile.

## Pattern 7 — Side panels can exist, but board should remain sovereign

RichUp desktop has left/right panels, but the board remains central and active.

### Panda Capital adaptation

Desktop can keep side drawers/panels if:

- board stays visually dominant
- primary turn action is on board center
- player/cash state is compact and peripheral
- side panels do not compete with action prompt

## Pattern 8 — Recent event log should be tiny and contextual

RichUp center log is small and near dice, not a huge dashboard panel.

### Panda Capital adaptation

Show last 3–5 events in board center or a translucent overlay:

- `Patrik rolled 6+3`
- `Patrik bought Trnavské mýto`
- `Clawd paid €26 rent`

Full log stays in drawer.

## Pattern 9 — Player list should communicate turn and threat quickly

RichUp right side player list shows players/cash and active state.

### Panda Capital adaptation

Seat rail should answer:

- who is on turn
- who is bankrupt/in debt
- who owns many properties
- who is human/agent/NPC
- cash amount

Keep it compact; do not let it steal board attention.

## Pattern 10 — Board readability beats ornamental art

Official games can rely on 3D/camera; Panda Capital must stay readable in browser. The board must not become pretty soup.

### Panda Capital adaptation

Before adding more art:

- fix tile hierarchy
- fix token pieces
- fix owner/building/mortgage states
- add center action stage
- then add richer art/animations

## Concrete TODO additions from research

### Ref-R1: Center action stage

Create `BoardCenterStage` inside `.board-center`:

- dice/roll button
- current prompt
- primary legal action buttons
- tiny event feed
- visual state for waiting/other player turn

### Ref-R2: Rotate / orient side tiles

Prototype side-specific tile content orientation:

- `side-bottom`, `side-left`, `side-top`, `side-right`
- measure readability
- if full rotate fails, use partial orientation and stronger selected detail

### Ref-R3: Replace bottom dock primary actions

Move primary turn actions from bottom dock into center stage. Bottom dock becomes secondary navigation only.

### Ref-R4: Setup as lobby

Implement explicit player count + seat kinds + token picker. No more name heuristic for bots.

### Ref-R5: Token/dice visual pass

Use token piece style and central dice overlay before any new decorative board art.

### Ref-R6: Mobile board-first mode

On mobile, center stage + bottom sheet should be the main UX. No side sheet pretending to fit.

## Non-goals / do not copy

- Do not copy Monopoly board colors/trade dress exactly.
- Do not copy Mr. Monopoly, official tokens, or protected board names.
- Do not copy RichUp visuals directly.
- Do not add ads/chat/share panels just because RichUp has them.
- Do not make sidebars dominant again.

## Priority adjustment

This research suggests the next major visual implementation should be:

1. Exit/setup navigation (`21`) because Patrik explicitly corrected it.
2. Center-board action stage + board readability (`28` + this file), before deeper decorative animation.
3. Seat/token setup (`22`, `23`).
4. Token/dice movement/animation (`25`).
