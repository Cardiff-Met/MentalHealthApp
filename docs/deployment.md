# Deployment Guide — MindSpace

This guide describes how to deploy MindSpace to a fresh production server. The target audience is a teammate who has not seen the project before; following this end-to-end should produce a working public deployment.

---

## 1. Production architecture

```
                          Internet
                              │
                              ▼  443/TCP
              ┌──────────────────────────────────┐
              │  Nginx reverse proxy (host)      │
              │  - TLS termination (Let's Encrypt)│
              │  - Static file hosting (Client)  │
              │  - Proxy /api → 127.0.0.1:3000   │
              │  - Security headers, gzip        │
              └──────────────┬───────────────────┘
                             │ HTTP loopback
                             ▼
              ┌──────────────────────────────────┐
              │  Docker network: mindspace-net   │
              │                                  │
              │  ┌──────────────┐  ┌──────────┐  │
              │  │  mindspace-  │──│ mindspace│  │
              │  │  api (Node)  │  │   -db    │  │
              │  │  127.0.0.1   │  │ (MySQL)  │  │
              │  │  :3000       │  │ no port  │  │
              │  └──────────────┘  │ exposed  │  │
              │                    └──────────┘  │
              └──────────────────────────────────┘
                             │
                             ▼
                    Named volume: db_data
```

**Key properties**
- Only ports **80** and **443** are open to the public Internet (Nginx).
- Node API binds to `127.0.0.1:3000` — unreachable from outside the host.
- MySQL exposes no host port — only the API can reach it via the internal Docker network.
- All secrets live in `.env.prod` on the server, never in the repo.

---

## 2. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Linux VPS | Ubuntu 22.04 LTS | 2 vCPU / 2 GB RAM is sufficient for ~200 concurrent users |
| Domain name | — | Required for TLS via Let's Encrypt |
| Docker | ≥ 24.0 | `curl -fsSL https://get.docker.com \| sh` |
| Docker Compose plugin | ≥ 2.20 | Bundled with modern Docker |
| Nginx | ≥ 1.18 | `sudo apt install nginx` |
| Certbot | latest | `sudo apt install certbot python3-certbot-nginx` |

---

## 3. First-time deployment

### Step 1 — Provision the server

```bash
# As root or with sudo on a fresh Ubuntu 22.04 box
adduser deploy
usermod -aG sudo,docker deploy
# Configure SSH key auth for `deploy`, then disable password auth in /etc/ssh/sshd_config
```

### Step 2 — Pull the code

```bash
sudo -iu deploy
git clone git@github.com:Cardiff-Met/MentalHealthApp.git /home/deploy/mindspace
cd /home/deploy/mindspace
```

### Step 3 — Configure secrets

```bash
cp .env.prod.example .env.prod
# Generate two strong JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Edit .env.prod and paste them in. Set DB passwords too.
nano .env.prod
chmod 600 .env.prod
```

### Step 4 — Build the front-end

```bash
cd Client
npm ci
npm run build       # outputs to Client/dist/
```

The `dist/` directory will be served by Nginx as static files in step 6.

### Step 5 — Start the back-end stack

```bash
cd /home/deploy/mindspace
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker compose -f docker-compose.prod.yml ps   # both services should be healthy
docker compose -f docker-compose.prod.yml logs -f server
```

Verify the API responds:

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok","message":"Server is running"}
```

### Step 6 — Configure Nginx

Create `/etc/nginx/sites-available/mindspace`:

```nginx
server {
    listen 80;
    server_name mindspace.example.com;

    # Serve the React build
    root /home/deploy/mindspace/Client/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback — every other path returns index.html so React Router can handle it
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed static assets aggressively; never cache index.html
    location ~* \.(js|css|svg|woff2?|png|jpg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mindspace /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 7 — Issue TLS certificate

```bash
sudo certbot --nginx -d mindspace.example.com
# Certbot rewrites the Nginx config to redirect 80 → 443 and adds the cert.
# It also installs a renewal timer; verify with:
sudo systemctl list-timers | grep certbot
```

### Step 8 — Smoke test

Open `https://mindspace.example.com` in a browser:
- The React app loads.
- Register a test account.
- Log in.
- Submit a mood log.

If anything fails, see the runbook (`docs/runbook.md`) for diagnosis.

---

## 4. Updating to a new version

```bash
cd /home/deploy/mindspace
git pull origin main

# Rebuild API image and restart with no downtime perceived by browser
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build server

# Rebuild front-end (Nginx serves files directly — no reload needed)
cd Client && npm ci && npm run build
```

Expected downtime: a few seconds while the API container restarts (Nginx will return 502s during that window). For genuine zero-downtime see the rollback section.

---

## 5. Rollback strategy

Each successful deployment should be tagged in git:

```bash
git tag -a release-2026-04-28 -m "Day 18 deployment"
git push --tags
```

To roll back:

```bash
cd /home/deploy/mindspace
git fetch --tags
git checkout release-2026-04-27           # previous good tag
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build server
cd Client && npm ci && npm run build
```

If the new release introduced a destructive migration, restore the DB volume from backup before rolling back code (see §6).

---

## 6. Database backups

A nightly cron-driven dump:

```bash
sudo crontab -e
# Add:
0 2 * * * docker exec mindspace-db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" mental_health_app' \
            | gzip > /home/deploy/backups/mindspace-$(date +\%Y\%m\%d).sql.gz
0 3 * * * find /home/deploy/backups/ -name "mindspace-*.sql.gz" -mtime +14 -delete
```

To restore from a dump:

```bash
gunzip -c /home/deploy/backups/mindspace-2026-04-27.sql.gz | \
  docker exec -i mindspace-db mysql -uroot -p"$DB_ROOT_PASSWORD" mental_health_app
```

**Recommended:** copy backups off the host nightly to S3 or another VPS via `rsync` or `aws s3 sync`.

---

## 7. Monitoring

| Concern | Recommended tool | Notes |
|---------|------------------|-------|
| Uptime | UptimeRobot or BetterStack (free tiers) | Probe `https://mindspace.example.com/health` every 5 minutes |
| Logs | `docker compose logs --tail 1000 -f` | For long-term retention, ship to a managed Loki / Datadog / Logtail account |
| Metrics | Prometheus + Grafana | Out of scope for v1; add `prom-client` middleware to Express when needed |
| Errors | Sentry SDK | Add `@sentry/node` to the API and `@sentry/react` to the Client when integrated |

---

## 8. Hardening checklist

Before marking the deployment "production":
- [ ] `.env.prod` has `chmod 600` and is owned by `deploy`.
- [ ] `JWT_SECRET` and `REFRESH_SECRET` are ≥ 64 hex chars and have NEVER been committed.
- [ ] DB ports are not exposed on the host (`docker compose -f docker-compose.prod.yml ps` shows no `0.0.0.0` for port 3306).
- [ ] Server bound to `127.0.0.1:3000`, not `0.0.0.0:3000`.
- [ ] TLS A-grade on https://www.ssllabs.com/ssltest/.
- [ ] `helmet` security headers visible in browser dev-tools (Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options).
- [ ] UFW firewall: only 22, 80, 443 open.
- [ ] SSH password auth disabled.
- [ ] Backups verified by performing a test restore into a scratch DB.
