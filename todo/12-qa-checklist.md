# 12 — QA Checklist

## Local checks

- `PYTHONPATH=server .venv/bin/python -m pytest -q`
- `cd web && npm run build`
- `git status --short`

## Production deploy checks

- GitHub Actions latest SHA is expected commit.
- Actions conclusion success.
- `GET /api/health` OK.
- Root HTML references latest JS/CSS assets.
- Public asset paths load.
- `POST /api/games` works with 2 players and 4 players.

## Gameplay API smoke

- Create 2-player game.
- Fetch state with p1 and p2 tokens.
- Legal actions are correct.
- Roll increments version.
- Buy/skip works.
- End turn works.
- Wait endpoint long-polls.

## Visual desktop QA

Viewport ~1280×720:

- Board visible immediately.
- Top HUD compact.
- No `Bot manual`.
- No `Let Clawd play` in 1v1.
- Owner flags readable.
- Deed hand/cards look like cards.
- Primary action visible.
- Log/rules hidden by default.

Viewport ~1440×900:

- Board dominates screen.
- Seats look like table seats.
- Side/drawer overlays do not make it feel like dashboard.

## Mobile / tablet QA

- iPhone-ish narrow viewport.
- iPad-ish viewport.
- Board visible without huge pre-scroll.
- Bottom action dock usable.
- Cards drawer usable.
- Log/rules/settings accessible.
- No sticky collisions.
- Safe-area bottom padding works.

## Midgame visual QA

Need seeded or played state with:

- Both players own properties.
- Multiple color groups.
- At least one railroad/utility.
- Auction phase.
- Chance/Community card.
- Debt/mortgage if possible.
- Buildings/hotel if possible.

Check:

- Owner clear from board.
- Buildings clear from board.
- Mortgage clear from board.
- Payment/rent visible without reading log.

## Replay protocol

- Send fresh p1 link only.
- Keep Clawd token private/local only.
- Start `/wait` loop only after Patrik says replay/play.
- If Patrik sends feedback screenshots, pause wait/autoplay immediately.
- Summarize meaningful moves only; don't spam every timeout.
