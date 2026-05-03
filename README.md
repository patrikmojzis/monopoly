# Monopoly Lite Web + Agent API

Tiny couch-friendly Monopoly-ish / Panda Capital game with the same shape as Patrik's Durak/Quoridor projects: FastAPI backend, Vite React frontend, SQLite persistence, tokenized player/agent API, and a Docker-first deployment path.

This is deliberately **Panda Capital / Monopoly-lite**, not a rules-lawyer clone. The point is fast couch play: roll, buy, pay rent, watch Clawd make financially questionable moves, repeat.

## Current MVP

- 2 players: `p1` Patrik, `p2` Clawd.
- Start cash: €1500.
- 20-space compact board.
- 2d6 dice, +€200 when passing GO.
- Buy unowned properties / railroads / utility.
- Pay rent when landing on opponent-owned spaces.
- Railroads scale rent when Clawd/Patrik owns multiple.
- Full color sets double property rent.
- Chance / Community Chest random small cash swings.
- Tax space charges €100.
- First bankrupt player loses, or first €2500 net worth wins.
- Browser can request an automatic Clawd turn via server-side `/clawd-turn`.
- Agent/API mode still works with player bearer tokens and `board.txt` / `legal-actions`.

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

## API shape

- `GET /api/health`
- `POST /api/games`
- `GET /api/games/{id}`
- `GET /api/games/{id}/legal-actions`
- `GET /api/games/{id}/board.txt`
- `GET /api/games/{id}/wait?since={version}`
- `POST /api/games/{id}/actions`
- `POST /api/games/{id}/clawd-turn`

Player and spectator access use bearer tokens returned by game creation.

Example agent loop:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/games/$GAME/board.txt"
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/games/$GAME/legal-actions"
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"roll"}' "$BASE/api/games/$GAME/actions"
```

## Files

- `server/app/engine.py` — pure game rules/state transitions.
- `server/app/storage.py` — SQLite JSON state persistence.
- `server/app/main.py` — FastAPI routes, token auth, Clawd auto-turn.
- `web/src/main.tsx` — React UI.
- `Dockerfile`, `docker-compose.yml` — deploy path.

## Optional GitHub Actions deploy

This repo includes `.github/workflows/deploy.yml`.

On every push to `main`, it can SSH into a Docker server, pull the latest repo, rebuild, restart, and healthcheck the app.

Required GitHub repo secrets:

- `SERVER_HOST` — server hostname/IP.
- `SERVER_USER` — SSH user, e.g. `root` or `deploy`.
- `SSH_PRIVATE_KEY` — private key with access to that user.
- `DEPLOY_PATH` — target directory, e.g. `/opt/panda-capital`.
- `PUBLIC_BASE_URL` — public URL, e.g. `https://capital.example.com`.

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
