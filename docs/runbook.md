# Runbook — MindSpace Operations

**Version:** 1.0 | **Last updated:** May 2026
**Platform:** Railway (managed cloud)
**Stack:** React/Vite (Frontend) → Express 5 (Backend) → MySQL 8 (Database)
**Live URL:** https://mindspace.lucamartinet.dev
**API Health:** https://desirable-enchantment-production-7b63.up.railway.app/health

All incidents are managed through the Railway dashboard at [railway.app](https://railway.app). There is no SSH access to a server.

---

## Quick reference

| Symptom | Most likely cause | Playbook |
|---------|-------------------|----------|
| Site unreachable or 5xx errors | Backend service down | [§1 — API Down](#1-api-completely-down) |
| Site responds but slowly | Backend overloaded | [§2 — Slow API](#2-slow-api) |
| API returns 500 on every request | MySQL service down | [§3 — Database Down](#3-database-down) |
| Browser shows certificate error or site unreachable | TLS / DNS issue | [§4 — TLS Issue](#4-tls--https-issue) |
| Suspected unauthorised access or leaked secret | Security breach | [§5 — Breach](#5-suspected-breach--leaked-secret) |

---

## 1. API completely down

**Symptom:** All API requests return 5xx or time out. Health check `GET /health` fails or returns no response.

**Step 1 — Check Railway service status**
Open [railway.app](https://railway.app) → MindSpace project → **Backend** service.
- Expected status: **Deployed** (green).
- If status is **Failed** or **Crashed** → go to Step 2.

**Step 2 — Read the deployment logs**
Railway dashboard → Backend → **Deployments** → latest → **View logs**.

Look for:
- `"JWT_SECRET must be at least 32 characters"` → fix in Railway → Backend → Variables, then redeploy.
- `"ECONNREFUSED"` on database host → MySQL service is down — see §3.
- `"Cannot find module"` or npm errors → build failed; check build logs.

**Step 3 — Redeploy**
Railway dashboard → Backend → **Deployments** → **Redeploy** (latest).
Wait ~60 seconds, then verify:
```bash
curl -f https://desirable-enchantment-production-7b63.up.railway.app/health
```

**Step 4 — Verify all required environment variables are set**
Railway dashboard → Backend → **Variables**. Confirm all of the following are present:
```
JWT_SECRET, REFRESH_SECRET, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
CLIENT_URL, CLIENT_URL_ALT, NODE_ENV=production
```

**Step 5 — Rollback**
Railway dashboard → Backend → Deployments → find last green deployment → three-dot menu → **Rollback**.

**Step 6 — Escalate**
If not resolved within 20 minutes, raise a GitHub issue tagged `[P1-INCIDENT]` and notify all team members.

---

## 2. Slow API

**Symptom:** API responds but slowly. `/health` returns 200 but `POST /api/auth/login` takes > 2 s.

**Step 1 — Baseline the latency**
```bash
time curl -s -o /dev/null https://desirable-enchantment-production-7b63.up.railway.app/health
```
If < 200 ms: network is fine; issue is application-level.

**Step 2 — Check Railway metrics**
Railway dashboard → Backend → **Metrics** tab.
- CPU consistently > 80% → possible tight loop; redeploy to reset the process.
- Memory steadily growing → possible memory leak; redeploy to reset, then raise a task to investigate.

**Step 3 — Check for rate-limit spam**
Railway dashboard → Backend → **Logs**. Search for `"Too Many Requests"`.
If frequent: a client is hammering the auth endpoint. Consider temporarily tightening the rate limit in `Server/src/app.js`, commit, and let Railway auto-deploy.

**Step 4 — Redeploy**
Railway dashboard → Backend → **Redeploy**. Monitor Metrics for 10 minutes after restart.

---

## 3. Database down

**Symptom:** API returns 500 with connection timeout errors. Railway shows the MySQL service as **Failed** or **Crashed**.

**Step 1 — Check the MySQL service**
Railway dashboard → MindSpace project → **Database** service.
- If status is **Failed**: open Deployments → View logs.

**Step 2 — Read MySQL logs**
- `"Out of disk space"` → upgrade the Railway volume in Settings.
- Repeated crash loops → verify `MYSQL_ROOT_PASSWORD` and `MYSQL_DATABASE` variables are set on the service.

**Step 3 — Restart the MySQL service**
Railway dashboard → Database → **Redeploy**.
Wait 60 seconds for InnoDB recovery. Then redeploy the Backend to clear its connection pool.

**Step 4 — Restore from backup (DATA-LOSS RISK)**

```bash
# Enable the public MySQL endpoint temporarily in Railway dashboard:
# Database → Settings → Enable Public Networking

mysql -h <RAILWAY_MYSQL_HOST> -P <RAILWAY_MYSQL_PORT> \
  -u <DB_USER> -p<DB_PASSWORD> mental_health_app \
  < mindspace-YYYY-MM-DD.sql
```

After restore, disable the public endpoint and redeploy the Backend.
Document the data-loss window in a GitHub incident report.

> **Backup note:** Railway does not provide automatic MySQL backups. Manual dumps must be taken before significant deployments (see `docs/deployment.md` §6).

---

## 4. TLS / HTTPS issue

**Symptom:** Browser shows a certificate error or the site is unreachable via HTTPS.

> Railway manages TLS certificates automatically — they renew without manual intervention. Most TLS issues are DNS-related.

**Step 1 — Check DNS**
Verify the CNAME for `mindspace.lucamartinet.dev` points to the Railway URL.
```bash
dig mindspace.lucamartinet.dev CNAME
```

**Step 2 — Check Railway certificate status**
Railway dashboard → Frontend → Settings → **Custom Domains**.
- If domain shows **"Certificate Pending"**: wait up to 10 minutes and refresh.
- If domain shows an error: remove and re-add the domain, then re-add the CNAME at your DNS provider.

**Step 3 — Custom domain broken but Railway URL works**
If `https://mindspace.lucamartinet.dev` is broken but `https://<random>.up.railway.app` works:
the CNAME record has been removed or changed. Re-add it at your DNS provider.

**Step 4 — Escalate**
If unresolved after 30 minutes, raise a GitHub issue tagged `[P2-TLS]` and check [status.railway.app](https://status.railway.app).

---

## 5. Suspected breach / leaked secret

**Symptom:** Unusual admin activity in `audit_log`; unexpected data requests; accounts accessed without owner's knowledge; `JWT_SECRET`, `REFRESH_SECRET`, or database credentials found in a public location.

### Immediate actions (first 15 minutes)

**Step 1 — Disable the Backend**
Railway dashboard → Backend → Settings → **Disable service**.
This stops all API traffic immediately.

**Step 2 — Rotate JWT secrets**
Railway dashboard → Backend → **Variables**.
Replace `JWT_SECRET` and `REFRESH_SECRET` with new 64-character random strings:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Save and redeploy. All previously issued JWTs are immediately invalid — all users are logged out. This is the intended behaviour.

**Step 3 — Rotate database credentials**
Railway dashboard → Database → **Variables**. Generate new passwords for `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD`.
Update the matching `DB_PASSWORD` variable on the Backend service.
Redeploy both services.

**Step 4 — Export logs before any restart**
Copy Railway deployment logs for Backend and Database.
Export relevant `audit_log` rows before the DB is restarted:

```bash
# Via Railway public endpoint (enable temporarily):
mysql -h <HOST> -P <PORT> -u <USER> -p<PASS> mental_health_app \
  -e "SELECT * FROM audit_log WHERE created_at > NOW() - INTERVAL 24 HOUR ORDER BY created_at DESC;"
```

**Step 5 — Identify affected accounts**
Cross-reference `audit_log` with Railway activity logs (dashboard → Activity).
Note the window of compromise and affected user accounts.

**Step 6 — Notify affected users**
Email affected users within 72 hours (GDPR Article 33/34).
File a GitHub incident report. If PII of EU data subjects was involved, notify the ICO within 72 hours.

**Step 7 — Re-enable the Backend**
Railway dashboard → Backend → **Redeploy** (with new secrets in place).
Verify `/health` returns 200 before announcing recovery.

---

## Useful commands

```bash
# Verify live health
curl https://desirable-enchantment-production-7b63.up.railway.app/health

# Check specific API endpoint
curl -s https://desirable-enchantment-production-7b63.up.railway.app/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' | jq .

# Connect to MySQL (requires public endpoint enabled in Railway dashboard)
mysql -h <RAILWAY_HOST> -P <RAILWAY_PORT> -u <DB_USER> -p<DB_PASSWORD> mental_health_app

# View last 50 audit log entries (via MySQL connection above)
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;

# View recent bookings
SELECT b.id, u.email, b.status, b.created_at
FROM bookings b JOIN users u ON b.user_id = u.id
ORDER BY b.created_at DESC LIMIT 20;
```

---

## Escalation contacts

| Severity | Description | Action |
|----------|-------------|--------|
| P1 — Site down or breach | Complete outage or confirmed security incident | Notify all team members immediately via Discord |
| P2 — Degraded service | Elevated errors or latency, partial functionality | Raise GitHub issue, investigate within 2 hours |
| P3 — Non-blocking | Minor issue, no user impact | Raise GitHub issue, address in next sprint |
