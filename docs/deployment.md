# Deployment Guide — MindSpace

MindSpace is deployed on **Railway** — a managed cloud platform that handles builds, TLS, and infrastructure automatically. There is no VPS, no Nginx, and no manual certificate management.

**Live URLs**
- Frontend: https://mindspace.lucamartinet.dev
- Backend API: https://desirable-enchantment-production-7b63.up.railway.app
- Swagger UI: https://desirable-enchantment-production-7b63.up.railway.app/api-docs/
- Health check: https://desirable-enchantment-production-7b63.up.railway.app/health
- Repository: https://github.com/Cardiff-Met/MentalHealthApp

---

## 1. Production architecture

```
                          Internet
                              │
                              ▼  HTTPS (Railway-managed TLS)
              ┌──────────────────────────────────────┐
              │  Railway Frontend Service            │
              │  Vite static build (npm run build)   │
              │  mindspace.lucamartinet.dev          │
              │  (CNAME → Railway URL)               │
              └──────────────────┬───────────────────┘
                                 │ VITE_API_URL (HTTPS)
                                 ▼
              ┌──────────────────────────────────────┐
              │  Railway Backend Service             │
              │  Node.js 20 + Express 5 (Dockerfile) │
              │  desirable-enchantment-production-   │
              │  7b63.up.railway.app                 │
              └──────────────────┬───────────────────┘
                                 │ Railway private network
                                 ▼
              ┌──────────────────────────────────────┐
              │  Railway MySQL Service               │
              │  MySQL 8 — no public port            │
              │  Persistent managed volume           │
              └──────────────────────────────────────┘
```

**Key properties**
- Railway provides TLS automatically — no Certbot, no renewal cron.
- The MySQL service has no public port; it is only reachable from the Backend via Railway's internal private network.
- All secrets are set in the Railway dashboard — never committed to the repo.
- Every push to `main` triggers an automatic rebuild and redeploy of both Backend and Frontend.

---

## 2. Railway project structure

The project has **three Railway services**:

| Service | Source | Notes |
|---------|--------|-------|
| MySQL 8 | Railway managed plugin | Persistent volume, no public port |
| Express API | `/Server` directory (uses `Server/Dockerfile`) | Auto-deploys on push to `main` |
| React/Vite SPA | `/Client` directory | Vite build, served as static site |

---

## 3. First-time deployment (fresh Railway project)

### Step 1 — Create the Railway project

1. Go to [railway.app](https://railway.app) and create a new project.
2. Choose **"Deploy from GitHub repo"** and select `Cardiff-Met/MentalHealthApp`.

### Step 2 — Add the MySQL service

1. Inside the project, click **"+ New"** → **"Database"** → **"Add MySQL"**.
2. Railway provisions a MySQL 8 instance with a persistent volume automatically.
3. Note the internal connection variables Railway generates — use these in the Backend environment.

### Step 3 — Configure the Backend service

Set the root directory to `/Server` in the Railway service settings. Railway will use `Server/Dockerfile` to build the image.

Set the following environment variables in **Railway → Backend → Variables**:

```
NODE_ENV=production
PORT=3000

# From the Railway MySQL service (copy the private network values)
DB_HOST=<railway-internal-mysql-host>
DB_PORT=3306
DB_USER=<mysql-user>
DB_PASSWORD=<mysql-password>
DB_NAME=mental_health_app

# Set CLIENT_URL to the frontend's public URL (custom domain or Railway default URL)
CLIENT_URL=https://mindspace.lucamartinet.dev
CLIENT_URL_ALT=https://<frontend-service>.up.railway.app

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-hex-char-random-string>
REFRESH_SECRET=<64-hex-char-random-string>
```

> **JWT_SECRET must be at least 32 characters.** The server will refuse to start if it is shorter — this is enforced at boot in `app.js`. Although `REFRESH_SECRET` length is not enforced at boot, it should also be ≥ 32 chars in production.

### Step 4 — Configure the Frontend service

Set the root directory to `/Client`. Set the following variable in **Railway → Frontend → Variables**:

```
VITE_API_URL=https://desirable-enchantment-production-7b63.up.railway.app
```

Railway detects Vite, runs `npm run build`, and serves the `dist/` output as a static site over HTTPS.

### Step 5 — First deploy

Railway builds and deploys automatically once environment variables are saved. Monitor the build logs in the Railway dashboard.

Verify the Backend is live:

```bash
curl https://desirable-enchantment-production-7b63.up.railway.app/health
# Expected: {"status":"ok","message":"Server is running"}
```

The Backend runs `Server/src/db/migrate.js` on startup, which applies the schema and seed data idempotently — no manual migration step is needed.

### Step 6 — Add the custom domain

1. Railway → Frontend → Settings → **Custom Domains** → Add domain.
2. Enter `mindspace.lucamartinet.dev`.
3. Railway shows a CNAME target (e.g. `<random>.up.railway.app`).
4. At your DNS provider, add:
   ```
   mindspace.lucamartinet.dev.  CNAME  <railway-cname-target>.
   ```
5. Wait for DNS propagation (up to 15 minutes). Railway issues the TLS certificate automatically once the CNAME resolves.

### Step 7 — Smoke test

- Open `https://mindspace.lucamartinet.dev` — the React SPA loads.
- Register a test account and log in.
- Log a mood entry and confirm resources appear.
- Open `https://desirable-enchantment-production-7b63.up.railway.app/api-docs/` — all 35 endpoints should be visible.

---

## 4. Continuous deployment (day-to-day)

Railway watches the `main` branch. Every merge to `main` (after CI passes on GitHub Actions) triggers an automatic rebuild and rolling redeploy:

1. GitHub Actions runs ESLint, Prettier, Jest (164 tests), and the Docker smoke-test.
2. If all checks pass, the PR is squash-merged to `main`.
3. Railway picks up the new commit, builds the updated Backend and Frontend, and deploys — typically within 2–3 minutes.
4. The previous deployment continues serving traffic until the new one passes its healthcheck.

**No manual steps are needed for routine deploys.**

---

## 5. Rollback

Railway keeps a full deployment history per service.

To roll back to a previous deployment:

1. Railway dashboard → Backend (or Frontend) → **Deployments**.
2. Find the last known-good deployment.
3. Click the three-dot menu → **Rollback**.

Railway redeploys that exact build immediately — no git checkout or image rebuild required.

If the rollback covers a destructive schema change, restore from backup (see §6) **before** rolling back the code.

---

## 6. Database backups

Railway does **not** provide automatic MySQL backups. Run manual dumps before any significant deploy:

```bash
# Connect using the Railway public connection string (visible in the MySQL service dashboard under "Connect")
mysqldump -h <RAILWAY_MYSQL_HOST> -P <RAILWAY_MYSQL_PORT> \
  -u <DB_USER> -p<DB_PASSWORD> mental_health_app \
  > mindspace-$(date +%Y-%m-%d).sql
```

Store dumps off-platform (e.g. encrypted S3 bucket or local encrypted drive).

To restore a dump:

```bash
mysql -h <RAILWAY_MYSQL_HOST> -P <RAILWAY_MYSQL_PORT> \
  -u <DB_USER> -p<DB_PASSWORD> mental_health_app \
  < mindspace-2026-04-28.sql
```

After restoring, redeploy the Backend service so it re-runs `migrate.js` against the restored schema.

---

## 7. Environment variable reference

| Variable | Service | Description |
|----------|---------|-------------|
| `NODE_ENV` | Backend | `production` |
| `PORT` | Backend | `3000` — Railway maps this to HTTPS automatically |
| `DB_HOST` | Backend | Railway internal MySQL hostname |
| `DB_PORT` | Backend | `3306` |
| `DB_USER` | Backend | MySQL user |
| `DB_PASSWORD` | Backend | MySQL password |
| `DB_NAME` | Backend | `mental_health_app` |
| `CLIENT_URL` | Backend | Primary frontend origin for CORS (`https://mindspace.lucamartinet.dev`) |
| `CLIENT_URL_ALT` | Backend | Secondary frontend origin for CORS (Railway default frontend URL) |
| `JWT_SECRET` | Backend | ≥ 32 chars — signs 15-min access tokens |
| `REFRESH_SECRET` | Backend | ≥ 32 chars — signs 7-day refresh tokens |
| `VITE_API_URL` | Frontend | Full backend URL injected at Vite build time |

All variables are set in the Railway dashboard and are never committed to the repository.

---

## 8. Local development

The Railway deployment does not affect local development. Local dev uses `docker compose up` with `Server/.env`:

```bash
# Terminal 1 — start API + DB via Docker Compose
docker compose up --build

# Terminal 2 — start Vite dev server
cd Client && npm run dev
```

The Vite client hot-reloads against the local API at `http://localhost:3000`.

---

## 9. Deployment checklist

Before marking a deployment as production-ready:

- [ ] `GET /health` returns `{"status":"ok"}` on the live Backend URL.
- [ ] `JWT_SECRET` and `REFRESH_SECRET` are ≥ 64 hex chars and have never been committed to git.
- [ ] MySQL service has no public port exposed (verify in Railway dashboard — the "Connect" tab should only show private network details).
- [ ] Frontend `VITE_API_URL` points to the correct Backend Railway URL.
- [ ] Custom domain CNAME resolves and Railway shows the certificate as **Active**.
- [ ] Helmet security headers visible in browser DevTools (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`).
- [ ] Swagger UI at `/api-docs/` loads and shows all 35 endpoints.
- [ ] All 164 server tests pass in CI before the deploy.
