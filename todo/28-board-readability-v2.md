# V2-H — Board readability and orientation

## Problem

Patrik’s latest feedback is the core truth: Panda Capital is almost playable now, but the board needs the most attention. It must be readable and navigable at a glance, while still feeling like a physical board game.

Current issues:

- Full-board tile text is still small and sometimes truncated.
- Tokens can read as grey UI pills instead of pieces.
- Owner/building/mortgage states exist but compete with tile labels.
- It is not always instantly obvious where the viewer is, who owns what, and what just happened.
- Board focus helps, but the board still needs better visual hierarchy.

## Product goal

The board should act like a “game map,” not a dense dashboard.

Within 2 seconds, a player should know:

1. Where am I?
2. Who is on turn?
3. Where did the last move land?
4. Who owns nearby properties?
5. Are there houses/hotels/mortgages?
6. What can I do now?

## Visual hierarchy

### 1. Space identity

Each tile must prioritize:

- short readable name
- price/rent only if useful at board scale
- type icon for special spaces

Long data should move to selected deed/details, not clutter the tile.

Potential tile modes:

- normal board tile: name + price or rent, owner color, token
- selected/hover tile: richer info
- deed/details panel: full info

### 2. Ownership

Owner should be readable by color first, initials second.

Potential direction:

- full-width owner color strip or clear edge band
- initials badge only once, not multiple markers
- owner marker must not fight token marker

### 3. Player tokens

Tokens should become figurines/chips:

- distinct shape/color per player
- emoji/avatar centered
- chunky base, shadow
- no grey vertical pill artifact
- current viewer token can glow
- last moved token can pulse/land

This overlaps V2-C but board readability owns the final look.

### 4. Buildings and mortgages

Houses/hotels should be iconic and spatially consistent:

- small row of houses on property strip
- hotel as single stronger icon
- mortgage as stamp but not covering name completely

### 5. Last action / orientation

After roll:

- landing tile pulses
- token movement or landing marker shows “this just happened”
- selected deed follows landed tile

### 6. Zoom / board focus

Board focus should be a readability tool, not just a bigger board.

Ideas:

- `Board focus` mode hides non-essential UI
- selected tile info becomes bottom popover/drawer
- `Me` and `Sel` controls remain
- perhaps add `Fit` / `Zoom` controls later

## Concrete implementation phases

### Board-R1: remove tile clutter

- Reduce always-on tile text to name + price/rent only.
- Hide duplicate or low-value icons where they hurt readability.
- Ensure special spaces have clear type styling.

### Board-R2: token piece redesign

- Replace grey/pill tokens with clear piece style.
- Support multiple tokens gracefully.
- Current/last moved token states.

### Board-R3: owner/building clarity

- Choose one owner marker pattern: color band + initials OR pennant, not stacked clutter.
- Place houses/hotel consistently.
- Mortgage stamp less destructive.

### Board-R4: selected/landing state

- Landing tile pulse after roll.
- Selected tile ring stronger and color-coded.
- Floating deed/drawer sync should feel intentional.

### Board-R5: focus/zoom polish

- Improve Board focus label/behavior.
- Add true fullscreen if useful.
- Keep action dock functional.

## QA checklist

- Screenshot at 1280×720: can identify viewer token, owner, and selected tile.
- Buy a property: owner appears once and clearly.
- Two tokens on one tile: both visible.
- Mortgage/building property still readable.
- Board focus materially improves readability.
- Mobile/narrow does not turn tokens into grey pills.

## Rule

Do not add more decorative art until this readability layer is solid. Pretty chaos is still chaos.
