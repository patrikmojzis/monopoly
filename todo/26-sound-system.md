# V2-F — Sound system

## Problem

Patrik asked if sounds can be used. Yes. Current first pass uses tiny WebAudio tones, but V2 should turn it into an intentional optional sound layer.

## Desired UX

- Sound off by default or remembered per browser.
- Clear 🔇/🔊 toggle.
- Short, non-annoying sounds:
  - dice roll
  - token landing
  - buy/build
  - rent/payment
  - card reveal
  - trade proposal/accept
  - error/blocked action
- Sounds must never block gameplay.

## Technical options

### Phase 1

- WebAudio synthesized tones, no asset files.
- Small and reliable.

### Phase 2

- generated/curated audio files in `public/sounds/`
- preload lightly
- keep volume low

## QA

- Toggle persists in localStorage.
- Sound plays only after user interaction.
- No console crash if AudioContext unavailable.
- Mobile browsers do not break actions.
