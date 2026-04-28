# Runbook — MindSpace Operations

This runbook describes how to diagnose and recover from common production incidents. All commands assume you are SSH'd into the production host as the `deploy` user, in `/home/deploy/mindspace`.

---

## Quick reference

| Symptom | Most likely cause | Page |
|---------|-------------------|------|
| Site returns `502 Bad Gateway` | API container down | [§1](#1-api-container-down) |
| Site returns `504 Gateway Timeout` | API slow / overloaded | [§2](#2-api-slow-or-overloaded) |
| API returns `500` on every request | DB unreachable | [§3](#3-database-down) |
| Browser cannot reach the site at all | TLS / DNS / firewall | [§4](#4-tls-or-certificate-issue) |
| Suspected breach / leaked secret | Rotate everything | [§5](#5-suspected-breach-or-leaked-secret) |

---

## 1. API container down

### Detection

- UptimeRobot alert on `/health` failing for ≥ 5 minutes.
- Browser shows `502 Bad Gateway`.
- `docker compose -f docker-compose.prod.yml ps` shows `mindspace-api` as `Exit (...)` or `unhealthy`.

### Diagnosis

```bash
docker compose -f docker-compose.prod.yml logs --tail 200 server
# Look for: uncaught exception, out-of-memory, connection refused
```

### Recovery

```bash
# Plain restart — fixes most transient failures
docker compose -f docker-compose.prod.yml restart server

# If that doesn't help, rebuild the image
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build server

# Verify
curl -s http://127.0.0.1:3000/health
```

If the API still won't start, roll back to the previous tag (see deployment guide §5) and open an incident ticket.

---

## 2. API slow or overloaded

### Detection

- p95 latency > 2 s sustained.
- 504 responses from Nginx.

### Diagnosis

```bash
# Active connections to the API
docker exec mindspace-api ss -tan | grep :3000 | wc -l

# Slow queries on the DB
docker exec -it mindspace-db mysql -uroot -p"$DB_ROOT_PASSWORD" -e \
  "SHOW FULL PROCESSLIST;" mental_health_app

# CPU / memory pressure on the host
top -bn1 | head -20
docker stats --no-stream
```

### Recovery

- If a runaway query: `KILL <id>` from the MySQL prompt.
- If memory pressure: temporarily scale the API: `docker compose -f docker-compose.prod.yml up -d --scale server=2` (requires an upstream load balancer; for a single-host install this is a stop-gap).
- If a malicious traffic spike: tighten the rate limit in `Server/src/app.js` and redeploy, or add Cloudflare in front.

---

## 3. Database down

### Detection

- API logs show `Error: connect ECONNREFUSED db:3306`.
- `docker compose -f docker-compose.prod.yml ps` shows `mindspace-db` not running or `unhealthy`.

### Diagnosis

```bash
docker compose -f docker-compose.prod.yml logs --tail 200 db
# Common causes: disk full, corrupted volume, OOM-killed
df -h /var/lib/docker
```

### Recovery

```bash
# Restart
docker compose -f docker-compose.prod.yml restart db

# If the data volume is corrupt — restore from last night's backup
docker compose -f docker-compose.prod.yml down
docker volume rm mindspace_db_data
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db
# Wait for db to be healthy, then load the dump:
gunzip -c /home/deploy/backups/mindspace-$(date +%Y%m%d -d yesterday).sql.gz | \
  docker exec -i mindspace-db mysql -uroot -p"$DB_ROOT_PASSWORD" mental_health_app
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d server
```

**Communicate to users:** if data was lost, post a status update on the wellbeing intranet page. GDPR Art. 33 may require notifying the ICO within 72 hours if personal data was affected.

---

## 4. TLS or certificate issue

### Detection

- Browser shows "Your connection is not private" / `NET::ERR_CERT_DATE_INVALID`.

### Diagnosis

```bash
sudo certbot certificates                   # show expiry dates
sudo systemctl status certbot.timer         # confirm renewal timer is active
sudo journalctl -u certbot.timer --since "30 days ago"
```

### Recovery

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

If renewal fails because port 80 is unreachable: confirm DNS `A` record points to the server and that UFW allows port 80.

---

## 5. Suspected breach or leaked secret

If `JWT_SECRET`, `REFRESH_SECRET`, or any DB credential is leaked (e.g. accidentally committed, posted in a PR, copied into a screenshot):

### Immediate (within 1 hour)

1. **Rotate the secret.** Generate a new value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update `.env.prod` on the server with the new secret.
3. Restart the API: `docker compose -f docker-compose.prod.yml restart server`.
   - This invalidates **every** existing access and refresh token — all users are logged out. This is the intended behaviour.
4. Force-rotate DB passwords: `ALTER USER 'mindspace_app'@'%' IDENTIFIED BY '<new>';` and update `.env.prod`.
5. Audit `audit_log` for suspicious admin actions in the leak window.

### Within 24 hours

6. Determine scope: was data accessed? Use server logs and `audit_log`.
7. If personal data was accessed by an unauthorised party: the DPO must notify the ICO within 72 hours per GDPR Art. 33.
8. If individual users were affected: notify them per GDPR Art. 34.
9. Open a post-mortem: timeline, root cause, prevention.

### Within 1 week

10. Apply preventative controls: secret-scanning pre-commit hook (`gitleaks`), restrict who can read `.env.prod`, mandatory PR review for any change that touches secrets-handling code.

---

## Useful one-liners

```bash
# Tail all logs in real time
docker compose -f docker-compose.prod.yml logs -f

# Container resource usage
docker stats --no-stream

# Disk usage (Docker volumes)
docker system df

# Free space on host
df -h

# Open a MySQL prompt as root
docker exec -it mindspace-db mysql -uroot -p"$DB_ROOT_PASSWORD" mental_health_app

# Show last 50 audit-log entries
docker exec -i mindspace-db mysql -uroot -p"$DB_ROOT_PASSWORD" -D mental_health_app \
  -e "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;"

# Tail Nginx access log
sudo tail -f /var/log/nginx/access.log
```

---

## Escalation contacts

| Severity | Person | Contact |
|----------|--------|---------|
| P1 — site down or breach | Project lead | (team channel) |
| P2 — degraded service | On-call dev | (team channel) |
| P3 — non-blocking | Backlog | GitHub issue |
