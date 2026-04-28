# Workshop Week 10: Deployment and Runbooks

## Assessment Point 3 — Final Agile and DevOps Submission

---

## 1. Production Environment Definition

For this module, **"production"** means a stable, reproducible environment where the system runs from a Docker image on any machine with Docker installed. No manual Node.js or MySQL installation is required on the host.

### What "production-ready" means for this project

| Requirement | How we meet it |
|-------------|---------------|
| Reproducible build | `docker compose build` produces the same image from any machine |
| Documented configuration | All required environment variables listed in `.env.example` |
| No hardcoded secrets | JWT secrets and DB credentials injected via `.env` file at runtime |
| Known limitations | Listed in Section 7 below |
| Health check | `GET /health` returns `{ status: 'ok' }` when the server is running |

### Infrastructure requirements

- **Docker** ≥ 24.0 and **Docker Compose** ≥ 2.0 installed on the host
- Ports **3000** (server) and **3306** (database) available on the host machine
- A `.env` file placed at `./Server/.env` (see Section 3)
- At least **512 MB RAM** and **1 GB disk** free

### What runs in Docker

| Container | Image | Port |
|-----------|-------|------|
| `mental-health-server` | Built from `./Server/Dockerfile` (Node 20 Alpine) | 3000 |
| `mental-health-db` | `mysql:8.0` (official) | 3306 |

The client (`React + Vite`) runs on the developer machine via `npm run dev` (port 5173). It proxies API calls to the server container on port 3000.

---

## 2. Deployment Plan

### Step 1 — Clone the repository

```bash
git clone git@github.com:Cardiff-Met/MentalHealthApp.git
cd MentalHealthApp
```

### Step 2 — Create the environment file

Copy the example and fill in your values:

```bash
cp Server/.env.example Server/.env
```

Edit `Server/.env`:

```env
PORT=3000
JWT_SECRET=your-strong-jwt-secret-here
REFRESH_SECRET=your-strong-refresh-secret-here
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root1234
DB_NAME=mental_health_app
CLIENT_URL=http://localhost:5173
```

> **Security note:** Never commit `.env` to the repository. It is listed in `.gitignore`.

### Step 3 — Build the Docker images

```bash
docker compose build
```

This builds the `mental-health-server` image from `Server/Dockerfile`. The `mysql:8.0` image is pulled from Docker Hub automatically.

Expected output:
```
[+] Building ...
 ✔ server  Built
```

### Step 4 — Start the containers

```bash
docker compose up -d
```

The `-d` flag runs containers in the background. On first start, MySQL initialises the database using `Server/src/db/schema.sql`.

### Step 5 — Verify the system is running

```bash
# Check container status
docker compose ps

# Hit the health endpoint
curl http://localhost:3000/health
```

Expected health response:
```json
{ "status": "ok", "message": "Server is running" }
```

Swagger API documentation is available at: `http://localhost:3000/api-docs`

### Step 6 — Start the client (development mode)

```bash
cd Client
npm install
npm run dev
```

The client is available at `http://localhost:5173`.

---

## 3. Configuration Reference

All environment variables required by the server:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Port the Express server listens on | `3000` |
| `JWT_SECRET` | **Yes** | Secret for signing access tokens (15 min) | `change-me-in-prod` |
| `REFRESH_SECRET` | **Yes** | Secret for signing refresh tokens (7 days) | `change-me-in-prod` |
| `DB_HOST` | **Yes** | MySQL hostname (use `db` inside Docker) | `db` |
| `DB_PORT` | No | MySQL port | `3306` |
| `DB_USER` | **Yes** | MySQL username | `root` |
| `DB_PASSWORD` | **Yes** | MySQL password | `root1234` |
| `DB_NAME` | **Yes** | MySQL database name | `mental_health_app` |
| `CLIENT_URL` | No | Allowed CORS origin | `http://localhost:5173` |

---

## 4. Runbook

### 4.1 System Overview

The MindSpace Mental Health Support App is a client–server web application. The **server** is a Node.js 20 / Express 5 REST API that handles authentication, mood logging, resource retrieval, and therapy session booking. The **database** is MySQL 8 storing users, mood logs, resources, therapy slots, and bookings. The **client** is a React 19 / Vite single-page application that communicates with the server via HTTP.

Both the server and database run as Docker containers managed by Docker Compose. The client runs separately in development mode.

---

### 4.2 Start-up Procedure

```bash
# 1. Navigate to the project root
cd MentalHealthApp

# 2. Ensure .env is present
ls Server/.env

# 3. Start all containers
docker compose up -d

# 4. Confirm both containers are running
docker compose ps
```

Expected output of `docker compose ps`:

```
NAME                   STATUS
mental-health-server   Up (healthy)
mental-health-db       Up
```

> Allow 10–15 seconds for MySQL to finish initialising on first start.

---

### 4.3 Monitoring

**Check container status:**
```bash
docker compose ps
```

**Check server logs (live):**
```bash
docker compose logs -f server
```

**Check database logs:**
```bash
docker compose logs db
```

**Health endpoint check:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","message":"Server is running"}
```

**Check the API is responding:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpass"}'
# Expected: 401 {"error":"Invalid email or password."}
# (A 401 means the server and DB are connected and responding correctly)
```

---

### 4.4 Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `curl: connection refused` on port 3000 | Server container not running | `docker compose up -d server` |
| Server starts then immediately exits | Missing or invalid `.env` file | Check `Server/.env` exists and contains all required variables |
| `Access denied for user 'root'` in server logs | DB password mismatch | Ensure `DB_PASSWORD` in `.env` matches `MYSQL_ROOT_PASSWORD` in `docker-compose.yml` |
| `Table doesn't exist` errors | Schema not initialised | Stop containers, remove DB volume, restart: `docker compose down -v && docker compose up -d` |
| Port 3000 already in use | Another process using the port | `docker compose down` then check with `netstat -ano | findstr :3000` (Windows) |
| CORS errors in the browser | `CLIENT_URL` mismatch | Set `CLIENT_URL=http://localhost:5173` in `.env` and restart server |
| JWT errors / 401 on all requests | Empty `JWT_SECRET` | Add `JWT_SECRET` to `.env` and restart: `docker compose restart server` |

---

### 4.5 Recovery Steps

**Restart the server container (config change or crash):**
```bash
docker compose restart server
```

**Full rebuild after code change:**
```bash
docker compose down
docker compose build server
docker compose up -d
```

**Roll back to a previous image (if tagged):**
```bash
docker compose down
docker tag mental-health-server:previous mental-health-server:latest
docker compose up -d
```

**Reset the database (destroys all data — development only):**
```bash
docker compose down -v          # removes named volume db_data
docker compose up -d            # re-initialises from schema.sql
```

> ⚠️ `docker compose down -v` permanently deletes all database data. Only use this in development.

---

## 5. Final Peer Review

### 5.1 Review Checklist

Conducted before the final submission. Each item was reviewed by at least one team member who did not write that part of the code.

| Area | Check | Reviewer | Result |
|------|-------|----------|--------|
| Repository structure | `/Client`, `/Server`, `/docs` folders present and logical | Luca | ✅ Pass |
| README | Build, run, test instructions present and accurate | Noe | ✅ Pass |
| Dockerfile | Builds successfully with `docker compose build` | Noe | ✅ Pass |
| Production compose | `docker-compose.prod.yml` validates with `docker compose config` | Noe | ✅ Pass |
| Server tests | 139 tests pass with `cd Server && npm test` | Luca | ✅ Pass |
| Client tests | 29 Vitest tests pass with `cd Client && npm test` | Luca | ✅ Pass |
| Integration test | Full register → cancel journey passes (`integration/user-journey.test.js`) | Luca | ✅ Pass |
| Security tests | SQL-injection, XSS, JWT-tampering, privilege-escalation all rejected | Abdisamad | ✅ Pass |
| Auth security | JWT middleware on all protected routes | Ahmed | ✅ Pass |
| Role-based access | `requireAdmin` and `requireTherapist` middleware on protected routes | Ahmed | ✅ Pass |
| Input validation | Email, password, mood rating validated before DB | Abdisamad | ✅ Pass |
| Password hashing | bcrypt cost 10 — no plain text passwords in DB | Abdisamad | ✅ Pass |
| No committed secrets | `.env`, `.env.prod` in `.gitignore`; `.env.example` and `.env.prod.example` present | Luca | ✅ Pass |
| SQL injection prevention | Parameterised queries throughout (verified by `attacks.test.js`) | Ahmed | ✅ Pass |
| Accessibility | WCAG 2.1 AA pass — skip link, ARIA roles, keyboard-only, mobile hamburger | Ahmed | ✅ Pass |
| NFR specification | `docs/nfr.md` covers 9 categories with codebase evidence | Noe | ✅ Pass |
| Threat model | `docs/threat-model.md` STRIDE matrix with 23 threats | Noe | ✅ Pass |
| Deployment guide | `docs/deployment.md` reproducible from a fresh VPS | Noe | ✅ Pass |
| Runbook | `docs/runbook.md` covers API/DB down, TLS, breach response | Noe | ✅ Pass |

### 5.2 Issues Found and Fixed

| Issue | Found by | Fix applied |
|-------|----------|-------------|
| `index.js` combined app setup and `listen()` — blocked supertest from importing the app | Luca (Week 9) | Extracted `app.js` (setup) from `index.js` (listen) |
| `JWT_SECRET` captured at module load time in `auth.js` — made test environment injection fragile | Luca (Week 9) | Changed to read `process.env.JWT_SECRET` at call time inside the function |
| `Server→Database` arrow was one-directional in architecture diagram | Noe | Updated `docs/architecture.svg` to show bidirectional arrows |
| Admin self-edit guard missing on role dropdown — admin could demote themselves | Ahmed (Day 12) | Disabled the dropdown for the current user; server-side check still rejects self-changes |
| Stale JWT in browser cache showed wrong nav links after role change | Luca (Day 12) | Documented the "log out + back in" requirement; long-term fix would be a server-pushed token refresh on role change |
| Day-13 a11y PR initially failed CI on Prettier formatting | Luca (Day 13) | Ran `npm run format`; added action item to introduce a pre-push hook in any future iteration |
| `localStorage` access tokens are exfiltratable by XSS — flagged in STRIDE threat model | Luca (Day 15) | Documented as residual-medium risk C1; mitigation tracked in Sprint 3 retro carry-over list |
| Multi-category resources stored as JSON column — required `parseCategories()` helper because mysql2 returns the value as a string in some driver versions | Abdisamad (Day 12) | Helper handles Array, JSON-string and plain-string inputs; covered by tests |

---

## 6. DevOps Evidence Pack

| Deliverable | Location |
|-------------|----------|
| Architecture diagram | `docs/architecture.svg` |
| Docker server image | `Server/Dockerfile` |
| Docker Compose (development) | `docker-compose.yml` |
| Docker Compose (production) | `docker-compose.prod.yml` |
| GitHub Actions — code quality | `.github/workflows/code-quality.yml` |
| GitHub Actions — Docker build + health check | `.github/workflows/docker-test.yml` |
| Environment variable template (dev) | `Server/.env.example` |
| Environment variable template (prod) | `.env.prod.example` |
| Scrum planning + branching policy | `docs/week06.md` |
| Sprint 1 PR evidence | `docs/week06.md` §6 |
| Sprint 2 plan + retro | `docs/sprint02.md` |
| Sprint 3 plan + retro | `docs/sprint03.md` |
| Non-functional requirements | `docs/nfr.md` |
| STRIDE threat model | `docs/threat-model.md` |
| Deployment guide | `docs/deployment.md` |
| Operational runbook | `docs/runbook.md` |
| Server test suite (139 tests) | `Server/src/__tests__/` |
| Client test suite (29 tests) | `Client/src/test/components.test.jsx` |
| Integration journey test | `Server/src/__tests__/integration/user-journey.test.js` |
| Attack-vector security tests | `Server/src/__tests__/security/attacks.test.js` |

---

## 7. Known Limitations

| Limitation | Detail |
|------------|--------|
| HTTPS configured for production only | The development compose runs over HTTP. The production compose + deployment guide (`docs/deployment.md`) configures Nginx + Let's Encrypt and sets `secure: true` on the refresh token cookie. |
| No email notifications | Booking status changes (Pending → Confirmed/Declined) are only visible when the student navigates to the booking page. No push or email notification is sent. Future work would integrate SendGrid / SES. |
| Single-node deployment | No load balancing or horizontal scaling is configured. The application is stateless (JWT) so horizontal scaling would only require a load balancer in front of multiple API replicas — see NFR §3 (SCALE-1, SCALE-3). |
| Access tokens stored in `localStorage` | Documented as residual-medium risk **C1** in `docs/threat-model.md`. Closing this risk requires a refactor to in-memory tokens + server-side rotation; tracked in Sprint 3 retro carry-over list. |
| bcrypt cost factor 10 | Acceptable today (~80 ms per hash on a 2024 server). STRIDE follow-up item AU4 to bump to 12 once login-latency budget allows. |
| Encrypted off-site DB backups not automated | The runbook documents nightly local backups and the deployment guide notes off-site copy via `rsync`/`aws s3 sync` as a manual step; full automation is in the Sprint 3 carry-over backlog. |
| No live cloud deployment for the demo | Per the assessment brief and Workshop Week 10 (*"production environment ... a cloud VM, a university server, **or a local production-like machine**"*), a live URL is not required. The system is verified to run end-to-end via `docker compose up` on any host with Docker installed. |
