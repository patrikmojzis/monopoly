# V2-G — QA and replay readiness

## Goal

Do not restart Patrik-vs-Clawd replay until V2 navigation/setup/token/animation basics are deployed and smoked.

## Checklist

- [ ] Exit to setup works and does not destroy old game accidentally.
- [ ] Setup supports explicit human/agent/NPC seat types.
- [ ] Default 2-player setup is Patrik Human + Clawd Agent.
- [ ] NPC seats are explicit and only NPC seats can auto-play.
- [ ] Token pieces are readable; no grey pill artifacts.
- [ ] Board focus is genuinely useful.
- [ ] Moving-token animation works after roll.
- [ ] Dice/money/card/turn animation first pass works or is intentionally deferred.
- [ ] Sound toggle works and is non-annoying.
- [ ] Desktop visual QA at 1280x720.
- [ ] Narrow/mobile-ish QA where possible.
- [ ] API smoke: health, create table, roll/buy/end, trade proposal path.
- [ ] Browser smoke: default game, menu, setup exit, cards/trade drawers.

## Replay procedure

Only after checklist passes:

1. Create fresh 2-player table.
2. Store Clawd token locally only under `.secrets/`.
3. Send Patrik only his browser link.
4. Start Clawd API loop using `/wait`.
5. Pause immediately if Patrik gives UX feedback.
