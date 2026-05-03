# Polish feedback from Patrik — live playtest

Source: Telegram live screenshots/playtest, 2026-05-03.

## Done

- Default game setup must be Patrik + Clawd only, not accidental 4-player with Angelina/Luna.
  - Fixed in `23a9002`: default 2 players; + add player explicit.
- Menu title had ugly/sticky dark background; menu lacked clear exit and had weak action order.
  - Fixed in `591f49f`: transparent title, explicit close, Exit first, New table lower.
- Bottom action dock had duplicate Menu button while hamburger exists in top chrome.
  - Fixed in `7bf4e10`: removed dock Menu; dock stays gameplay-focused.
- Board needed more fullscreen/board-only space.
  - First pass `7fa635e`: Board/HUD focus toggle, hides clutter and enlarges board.
- Dice should feel animated and sounds should exist.
  - First pass `7fa635e`: dice HUD tumble/shake + sound toggle + basic WebAudio action sounds.

## Still desired / next polish

- Moving-token animation after roll: token should visibly travel / hop from old space to new space.
- Better table setup screen:
  - choose player count 2/3/4 using big chips
  - names per seat
  - emoji/token picker per seat
  - NPC seats only when explicitly selected
  - later replace emoji tokens with image-gen character tokens / figurines
- Consider image-gen sprite/art pass for dice/token/character assets after DOM/CSS flow is solid.
- Continue tightening board readability: tile text is acceptable but still small on full board.
