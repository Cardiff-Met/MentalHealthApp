# Live Demo Deployment — Vercel + Render + Aiven (free tier)

This is the **actual** deployment used for the live marker demo. It runs entirely on free tiers and takes ~30 minutes to set up end-to-end.

For the production-grade VPS pattern (the architecture we'd ship in a real-world setting), see [`deployment.md`](./deployment.md).

---

## Stack

| Layer | Provider | Free tier limits |
|-------|----------|------------------|
| Front-end | **Vercel** | Unlimited static sites, generous bandwidth, deploys on git push |
| Back-end (Node API) | **Render** (Web Service) | 750 free hours/month; sleeps after 15 min idle, ~30s cold start |
| Database (MySQL 8) | **Aiven for MySQL** | 1-month free trial, then ~$15/mo (sufficient for marking window) |

DNS / TLS / build pipelines are all handled automatically by Vercel and Render.

---

## 1. Provision the database (Aiven)

1. Sign up at https://aiven.io with a GitHub account.
2. **Create service** → MySQL 8 → free hobbyist plan → AWS / `eu-west-2` (London) for low latency to UK markers.
3. Wait ~3 minutes for the service to come up.
4. From the service overview page, copy the connection string. It looks like:
   ```
   mysql://avnadmin:<password>@<service>.aivencloud.com:<port>/defaultdb?ssl-mode=REQUIRED
   ```
5. Click **Quick connect** → download the `ca.pem` certificate file (Aiven requires TLS).
6. Open Aiven's web console for the service → **Query editor** → paste the contents of `Server/src/db/schema.sql` and run it. This seeds all tables.

---

## 2. Update the server to support TLS-required MySQL

Aiven enforces TLS, so the existing `mysql2` connection in `Server/src/db/connection.js` needs to know that. Add the certificate inline (Render doesn't have a writable filesystem for uploads).

In Render's dashboard later, you'll paste the contents of `ca.pem` into a `DB_CA_CERT` env var. The connection code becomes:

```js
// Server/src/db/connection.js
const mysql = require('mysql2/promise');

const useTLS = process.env.DB_CA_CERT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ...(useTLS && { ssl: { ca: process.env.DB_CA_CERT } }),
});

module.exports = pool;
```

(If your file already builds the pool differently, just add the conditional `ssl` block — the rest stays.)

---

## 3. Deploy the back-end (Render)

1. Sign up at https://render.com with GitHub.
2. **New → Web Service** → connect the `Cardiff-Met/MentalHealthApp` repo.
3. Settings:
   - **Name:** `mindspace-api`
   - **Region:** Frankfurt (closest to UK on free tier)
   - **Branch:** `main`
   - **Root Directory:** `Server`
   - **Runtime:** Docker (Render will pick up `Server/Dockerfile`)
   - **Plan:** Free
4. Click **Advanced** → add the following **Environment variables**:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `CLIENT_URL` | (fill in after Vercel deploy — e.g. `https://mindspace.vercel.app`) |
   | `DB_HOST` | (Aiven host) |
   | `DB_PORT` | (Aiven port) |
   | `DB_USER` | `avnadmin` |
   | `DB_PASSWORD` | (Aiven password) |
   | `DB_NAME` | `defaultdb` |
   | `DB_CA_CERT` | paste the full contents of `ca.pem` |
   | `JWT_SECRET` | generate via `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
   | `REFRESH_SECRET` | (a different random 64-hex value) |
5. **Create Web Service.** Render builds the Docker image and starts it. First build takes ~5 minutes; subsequent deploys are ~2 minutes.
6. Once green, the API URL will look like `https://mindspace-api.onrender.com`. Verify:
   ```bash
   curl https://mindspace-api.onrender.com/health
   # {"status":"ok","message":"Server is running"}
   ```

> **Free-tier caveat:** Render free web services sleep after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. For a live demo, ping the `/health` endpoint right before showing it to the marker.

---

## 4. Deploy the front-end (Vercel)

1. Sign up at https://vercel.com with GitHub.
2. **New Project** → import `Cardiff-Met/MentalHealthApp`.
3. Settings:
   - **Framework preset:** Vite
   - **Root Directory:** `Client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment variables** — add a single one:
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE` | `https://mindspace-api.onrender.com` |

   (If the Client currently uses Vite's dev proxy `/api` → localhost, switch the production fetch base to read this env var. See §5 below.)
5. Deploy. Vercel issues a URL like `https://mindspace-<hash>.vercel.app`.
6. **Loop back to Render**: edit the `CLIENT_URL` env var on the API service to the Vercel URL, then trigger a manual redeploy of the API so CORS is updated.

---

## 5. One-line client change for production API base

The dev setup proxies `/api` via Vite. In production, the API lives on a different origin, so set:

```js
// Client/src/context/AuthContext.jsx (and anywhere else that calls fetch)
const API_BASE = import.meta.env.VITE_API_BASE || '';
fetch(`${API_BASE}/api/auth/login`, ...)
```

`VITE_API_BASE` is empty in dev (so `/api/...` hits the Vite proxy as today) and the Render URL in production.

If you want to avoid touching every fetch call, an alternative is to add a Vercel rewrite. Create `Client/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://mindspace-api.onrender.com/api/:path*" }
  ]
}
```

This makes Vercel proxy `/api/*` to Render server-side, so the front-end code keeps its current `fetch('/api/...')` calls. Trade-off: every API call round-trips Vercel's edge, adding ~50ms.

---

## 6. Smoke test

Open the Vercel URL in a fresh browser:
- [ ] Page loads (Vite build is correct)
- [ ] Register a new account → 201 Created
- [ ] Log in → access token returned
- [ ] Submit a mood log → resources returned
- [ ] Open Network tab → confirm requests go to `mindspace-api.onrender.com`

If CORS errors appear in the console: the `CLIENT_URL` env var on Render isn't set to the Vercel URL. Update and redeploy.

---

## 7. Continuous deployment

Both Vercel and Render watch `main` automatically:
- Push to `main` → Vercel rebuilds the Client (~30s)
- Push to `main` → Render rebuilds the API (~2min)

PR previews on Vercel are enabled by default, so every open PR gets its own preview URL — useful to share with markers.

---

## 8. What this setup is **not**

To keep expectations honest, the differences vs the production guide in `deployment.md`:

| Concern | This setup | Production setup |
|---------|------------|------------------|
| Cost | Free (1-month DB trial) | ~$5–20/mo VPS |
| Cold starts | ~30s after idle | None |
| TLS | Managed by Vercel/Render | Let's Encrypt + Nginx |
| DB backups | Aiven daily snapshots | Custom cron + offsite copy |
| Audit log retention | Until DB trial ends | Indefinite |
| SLA | None | 99.5% target (see NFR §2) |

For a marker demo this is fine; for a real launch we would migrate to the production architecture documented in `deployment.md`.
