# Game Mode v2 Polish — overview

Goal: move Panda Capital from “good web board game UI” to “feels like a real digital board game.”

This sprint is not random polish. It addresses Patrik’s live playtest feedback after Game Mode v1:

- exit should mean leaving game to setup/main page, not closing menu
- setup must explicitly choose humans / agents / NPC bots
- board should have a cleaner fullscreen/focus mode
- board readability/orientation is the main remaining product risk
- tokens must look like figurines/chips, not grey pills
- dice, movement, money, cards, and turns need real motion
- sounds should exist but stay optional
- menu and navigation must feel intentional, not dashboard-ish

## Working rules

1. Plan first, then implement phase by phase.
2. No more heuristic “NPC by name” as the final design.
3. Prefer a clear product model over quick visual hacks.
4. Keep board readability above decoration.
5. Every phase gets tests/build/deploy/QA before replay resumes.
6. Tokens/links stay out of commits.

## V2 phase order

- V2-A: navigation + exit-to-setup semantics (`21`)
- V2-B: table setup / seat model (`22`)
- V2-C: token figurines + picker (`23`)
- V2-D: fullscreen board comfort (`24`)
- V2-H: board readability and orientation (`28`)
- V2-E: animation system (`25`)
- V2-F: sound system (`26`)
- V2-G: QA + replay readiness (`27`)

## Immediate known issue

The small grey vertical pill seen in Patrik’s screenshot is the current token chip rendering on small tiles. It reads as a visual artifact, not a player piece. V2-C must replace it with clear figurines/chips.
