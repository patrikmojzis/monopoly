# V2-D — Fullscreen board comfort

## Problem

Board focus is improved, but Patrik still wants “full screen čisto toho boardu” to read the board more easily.

Current Board/HUD toggle is a first pass. V2 should make it feel intentional.

## Desired modes

### Normal mode

- top chrome
- compact HUD
- seat rail
- board
- action dock

### Board focus mode

- board dominates viewport
- HUD and seats hidden/collapsed
- top chrome reduced to tiny floating controls
- action dock stays usable but minimal
- selected/deed info becomes drawer or temporary popover, not permanent panel

### Optional true fullscreen

- browser fullscreen API button (`document.documentElement.requestFullscreen`) if supported
- fallback: CSS board focus mode only

## Controls

- Top control label should be clear:
  - `Board focus` / `Exit focus`, not ambiguous `Board` / `HUD` if confusing
- `Me`, `Sel`, pan controls remain accessible.

## QA

- Desktop 1280x720 board focus makes board materially larger.
- No hidden required action buttons.
- Escape/fullscreen exit does not break state.
- Mobile board focus gives useful panning and controls.
