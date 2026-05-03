# V2-C — Token figurines and token picker

## Problem

Patrik screenshot showed a grey vertical pill on tiles. That is supposed to be a player token/chip, but it reads as a UI artifact.

Tokens must become clear, delightful board-game pieces.

## Desired UX

### Setup picker

Each seat chooses a token:

- quick emoji tokens first:
  - 🐼 Clawd
  - 🧑‍💻 Patrik
  - 🌙 Luna
  - 🦊 Angelina
  - 🚗 car
  - 🎩 hat
  - 🐕 dog
  - 🚀 rocket
- later image-gen figurines / PNG tokens in the same slot system

### Board rendering

Tokens on tiles should look like physical pieces:

- round/chunky base
- color by player
- visible emoji or image centered
- no grey vertical capsule
- supports multiple tokens on one tile without unreadable stacking
- selected/current player token has subtle glow or bounce

### Art pipeline later

Use image generation for a consistent token sheet:

- board-game figurine style
- transparent PNG or sprite sheet
- 4–8 characters
- same lighting/materials as Panda Capital board art

## Implementation notes

- Replace `.tokens span` pill styles with `.player-token-piece`.
- Store token choice in GameState (after V2-B backend model).
- Before backend storage exists, derive emoji with existing `emojiFor` but render correctly.

## QA

- Screenshot tiles at 1280x720; tokens recognizable.
- Multiple tokens on same tile do not become grey blobs.
- Token is visible on mobile/board-focus.
- No token overlaps owner pennant too badly.
