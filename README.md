# Panda Capital — Classic Board + Agent API

Classic property-board chaos with the same shape as Patrik's Durak/Quoridor projects: FastAPI backend, Vite React frontend, SQLite persistence, tokenized player/agent API, and Docker-first deployment.

This is **classic Monopoly-inspired**, but with original Panda Capital board names/art so the public repo/site does not cosplay as Hasbro bait. The gameplay vibe is normal property capitalism: roll, buy, pay rent, go to Jail, draw cards, build houses/hotels-lite, bankrupt your friends lovingly.

## Current v2

- 2–4 players via `POST /api/games` `playerNames`, defaulting to Patrik / Clawd.
- Browser invite URLs and bearer-token API configs for every player plus spectator.
- 40-space board with GO, Jail, Go To Jail, Free Parking, taxes, Chance, Community Cache, railroads, utilities, and 8 property color groups.
- Start cash: €1500; pass GO: +€200.
- Buy/skip unowned properties, railroads, utilities.
- Automatic rent, railroad scaling, utility dice rent, and color-set rent doubling.
- Houses/hotels-lite after owning a full color set; build evenly.
- Jail flow: roll doubles, pay €50, or use a rate-limit pass card.
- Doubles give an extra turn; three doubles sends the player to Jail.
- Bankruptcy eliminates a player and returns properties to the bank; last active player wins.
- Bot helper endpoint can play the current non-Patrik player (`/bot-turn`); `/clawd-turn` remains as a compatibility alias.
- Agent/API mode works with player bearer tokens and `board.txt` / `legal-actions` / `actions`.

## Docker deployment

```bash
cp .env.example .env
# edit PUBLIC_BASE_URL, e.g. https://monopoly.example.com
docker compose up -d --build
```

Default compose binds to localhost:

```env
HOST_BIND=127.0.0.1
HOST_PORT=8000
PUBLIC_BASE_URL=http://localhost:8000
```

For a public server behind Caddy/Nginx, keep the app on localhost and proxy to `127.0.0.1:8000`.

Persistent game DB lives in the `monopoly_data` Docker volume at `/data/monopoly.sqlite3`.

## Local development

Backend:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r server/requirements.txt
PYTHONPATH=server MONOPOLY_DB_PATH=data/dev.sqlite3 WEB_DIST_DIR=web/dist uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd web
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

Production frontend build without Docker:

```bash
cd web
node ./node_modules/typescript/bin/tsc && node ./node_modules/vite/bin/vite.js build
```

Tests:

```bash
. .venv/bin/activate
pip install -r server/requirements-dev.txt
PYTHONPATH=server python -m pytest -q
```

## API shape

- `GET /api/health`
- `POST /api/games`
  - body example: `{ "playerNames": ["Patrik", "Clawd", "Angelina", "Luna"] }`
- `GET /api/games/{id}`
- `GET /api/games/{id}/legal-actions`
- `GET /api/games/{id}/board.txt`
- `GET /api/games/{id}/wait?since={version}`
- `POST /api/games/{id}/actions`
- `POST /api/games/{id}/bot-turn`
- `POST /api/games/{id}/clawd-turn` compatibility alias

Player and spectator access use bearer tokens returned by game creation.

Example agent loop:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/games/$GAME/board.txt"
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/games/$GAME/legal-actions"
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"roll"}' "$BASE/api/games/$GAME/actions"
```

For build actions, include `spaceId` from `legal-actions`:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"build","spaceId":1}' "$BASE/api/games/$GAME/actions"
```

## Files

- `server/app/engine.py` — pure game rules/state transitions.
- `server/app/storage.py` — SQLite JSON state persistence.
- `server/app/main.py` — FastAPI routes, token auth, bot auto-turn.
- `web/src/main.tsx` — React UI.
- `Dockerfile`, `docker-compose.yml` — deploy path.

## Optional GitHub Actions deploy

This repo includes `.github/workflows/deploy.yml`.

On every push to `main`, it can SSH into a Docker server, pull the latest repo, rebuild, restart, and healthcheck the app.

Required GitHub repo secrets:

- `SERVER_HOST` — server hostname/IP.
- `SERVER_USER` — SSH user, e.g. `root` or `deploy`.
- `SERVER_PORT` — optional SSH port, defaults to `22`.
- `SSH_PRIVATE_KEY` — private key with access to that user.
- `DEPLOY_PATH` — target directory, e.g. `/srv/monopoly`.
- `PUBLIC_BASE_URL` — public URL, e.g. `https://monopoly.example.com`.

Optional secrets:

- `HOST_BIND` — defaults to `127.0.0.1`; use `0.0.0.0` only if exposing directly without reverse proxy.
- `HOST_PORT` — defaults to `8000`.

Server prerequisites:

```bash
apt update
apt install -y git docker.io docker-compose-plugin python3
systemctl enable --now docker
```

Recommended production shape: keep `HOST_BIND=127.0.0.1`, then expose via Caddy/Nginx reverse proxy with TLS.

### Recommended deploy user

Use a dedicated SSH user instead of root:

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p /srv/monopoly
chown -R deploy:deploy /srv/monopoly
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Then set GitHub secret `SERVER_USER=deploy` and `DEPLOY_PATH=/srv/monopoly`.

Note: membership in the `docker` group is powerful and effectively close to root access. It is still cleaner than enabling root SSH. For a stricter setup, use a root-owned deploy script with narrowly scoped sudo permissions.
