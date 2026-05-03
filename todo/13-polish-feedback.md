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

## 2026-05-03 — V2 live QA notes

Commits deployed and QA-smoked:

- `7b18998` — moved primary actions onto board center.
- `43f94da` — physical side/tokens pass.

Live browser QA confirmed:

- Default 2-player setup still creates Patrik + Clawd only.
- Board center stage appears inside the board with dice/action prompt.
- Before roll: center shows dice + Roll CTA.
- After roll: center updates to Buy/Auction actions.
- Bottom dock no longer owns primary actions; it is secondary Cards/Trade/status.
- Menu has separate `Back to board` and `Exit game to setup`.
- `Exit game to setup` returns to landing/setup `/` without server delete semantics.
- Token pieces no longer look like grey pill artifacts; chunky token pieces are live.
- Side tile orientation is live, but should be treated as prototype: physical feel improved, readability may need hybrid tuning.

QA screenshots:

- Initial board/action stage: `/root/.panda/agents/clawd/media/browser/296e5c35-73a4-44af-947c-78c0e90577ff/1777843412245-565d4e64-496d-454b-9b0b-1ec73f7f225a.png`
- Menu open: `/root/.panda/agents/clawd/media/browser/296e5c35-73a4-44af-947c-78c0e90577ff/1777843432755-20d6097a-0a72-4e7a-bcf2-4c5511be48d9.png`
- After roll: `/root/.panda/agents/clawd/media/browser/296e5c35-73a4-44af-947c-78c0e90577ff/1777843460284-cd26c4c7-68b1-457b-9bcf-d5a574650ed0.png`
- After exit setup: `/root/.panda/agents/clawd/media/browser/296e5c35-73a4-44af-947c-78c0e90577ff/1777843488345-40c98d7f-4a47-42db-abbf-723724d6a56e.png`

Next product call:

- Tune side-tile orientation/readability before deeper feature work if Patrik says it feels weird.
- Otherwise continue V2-B/V2-C: explicit lobby seat model + token picker.
