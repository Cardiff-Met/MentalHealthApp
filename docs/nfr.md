# Non-Functional Requirements — MindSpace

This document captures the non-functional requirements (NFRs) that constrain how the MindSpace mental-health support platform is built and operated. Each requirement is given an ID, a target/metric, the rationale, and the implementation evidence in the current codebase.

---

## 1. Performance

| ID | Requirement | Target | Evidence / Implementation |
|----|-------------|--------|----------------------------|
| **PERF-1** | API request latency (p95) for read endpoints | ≤ 300 ms under nominal load | Express 5 + MySQL with primary-key/indexed lookups; `helmet` adds <1 ms overhead. |
| **PERF-2** | API request latency (p95) for write endpoints | ≤ 500 ms | Single-row inserts, no synchronous external calls in hot path. |
| **PERF-3** | First Contentful Paint on the dashboard | ≤ 2.0 s on 4G | Vite production build code-splits each route; Tailwind v4 JIT keeps CSS small. |
| **PERF-4** | JSON body size limit | 100 KB | Enforced by `express.json({ limit: '100kb' })` in `Server/src/app.js`. |

**Notes:** Performance has not been benchmarked under load — these targets are design goals to be validated with k6/Apache Bench during the deployment phase.

---

## 2. Availability

| ID | Requirement | Target | Evidence |
|----|-------------|--------|----------|
| **AVAIL-1** | Production uptime | ≥ 99.5% per month (~3.6h downtime budget) | Docker Compose with healthcheck on the DB; server waits for `db.healthy` before starting (see `docker-compose.yml`). |
| **AVAIL-2** | Recovery time after a single-node DB crash | ≤ 5 minutes | MySQL data lives in a named volume; `docker compose up -d db` brings it back. |
| **AVAIL-3** | Graceful start-up | Server must not accept traffic until DB ready | Healthcheck-gated startup (commit `34784b8`). |

---

## 3. Scalability

| ID | Requirement | Target | Evidence |
|----|-------------|--------|----------|
| **SCALE-1** | Concurrent students supported by a single server instance | 200 concurrent active sessions | Stateless JWT auth — no session store required, allowing horizontal scaling behind a load balancer. |
| **SCALE-2** | Database connection pooling | Pool size auto-sized to load | `mysql2/promise` pool reused across requests in `db/connection.js`. |
| **SCALE-3** | Horizontal scalability | Application layer is stateless and replica-safe | No in-memory caches; refresh tokens are stored as DB-side hashes. |

---

## 4. Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| **SEC-1** | Passwords never stored in plain text | `bcrypt` with cost factor 10 in `authController.js`. |
| **SEC-2** | All authenticated endpoints require a valid JWT | `requireAuth` middleware on every protected route. |
| **SEC-3** | Refresh tokens are HTTP-only, SameSite, secure cookies | Cookie flags set in `authController.js` login response. |
| **SEC-4** | Brute-force resistance on auth endpoints | `express-rate-limit` — 5 requests / 15 min on `/api/auth/*`. |
| **SEC-5** | OWASP-recommended security headers | `helmet()` enabled globally. |
| **SEC-6** | SQL injection prevention | All queries use parameterised statements (`mysql2` placeholders). |
| **SEC-7** | XSS prevention | React auto-escapes interpolated strings; no `dangerouslySetInnerHTML`. |
| **SEC-8** | Secrets never committed to git | `.env` is git-ignored; `JWT_SECRET` ≥ 32 chars validated at boot. |
| **SEC-9** | Strict CORS policy | Origin allow-list pinned to `CLIENT_URL`. |
| **SEC-10** | Audit log for sensitive actions | `audit_log` table (see `schema.sql`). |

For the full threat analysis see [`threat-model.md`](./threat-model.md).

---

## 5. Accessibility

Compliance target: **WCAG 2.1 Level AA**.

| ID | Requirement | Evidence |
|----|-------------|----------|
| **A11Y-1** | All form controls have programmatically associated labels | `htmlFor`/`id` pairing on Login, Mood, Profile pages. |
| **A11Y-2** | Live error messages are announced to screen readers | `role="alert"` + `aria-live="assertive"` on error banners. |
| **A11Y-3** | Loading states are announced | `LoadingSpinner` uses `role="status"` + `aria-live="polite"`. |
| **A11Y-4** | Keyboard-only navigation across the entire app | Focus rings on every interactive element; Tab order matches reading order. |
| **A11Y-5** | Skip-to-main-content link on every page | Implemented in `AppShell.jsx` (Day 13). |
| **A11Y-6** | Mood selector behaves as a proper radio group | `role="radiogroup"` + per-option `role="radio"` and `aria-checked`. |
| **A11Y-7** | Mobile responsiveness from 320 px upward | Hamburger menu + `overflow-x-auto` on calendar grids. |
| **A11Y-8** | Colour contrast | Tailwind palette pairs (e.g. `slate-700` on white) meet 4.5:1 minimum. |

---

## 6. Maintainability

| ID | Requirement | Evidence |
|----|-------------|----------|
| **MAINT-1** | Lint-clean codebase before merging | ESLint 9 enforced on every PR via GitHub Actions. |
| **MAINT-2** | Consistent formatting | Prettier `format:check` runs in CI. |
| **MAINT-3** | Automated test suite executed on every PR | Jest (server) + Vitest (client) — currently 50+ tests. |
| **MAINT-4** | Branch protection | All changes flow through reviewed PRs; CI must pass before merge. |
| **MAINT-5** | Documented API surface | Swagger UI served at `/api-docs`. |
| **MAINT-6** | Idempotent migration runner | `Server/src/db/migrate.js` checks `information_schema` before each ALTER. |

---

## 7. Reliability

| ID | Requirement | Evidence |
|----|-------------|----------|
| **REL-1** | Application fails fast on bad configuration | App throws if `JWT_SECRET` is missing or weak. |
| **REL-2** | Centralised error handler — no stack traces leak to clients | Global error middleware in `app.js` returns generic 500 messages; logs internally. |
| **REL-3** | Per-request input validation at the controller boundary | Type/length checks in every controller (e.g. mood rating ∈ 1..5). |

---

## 8. Privacy & GDPR

| ID | Requirement | Evidence |
|----|-------------|----------|
| **GDPR-1** | Right to access (Art. 15) — user can view all data held about them | `GET /api/users/me/export` returns full JSON dump. |
| **GDPR-2** | Right to erasure (Art. 17) — user can delete their account | `DELETE /api/users/me` soft-deletes user, anonymises `mood_logs.description`, revokes refresh tokens. |
| **GDPR-3** | Right to rectification (Art. 16) | `PATCH /api/users/me` for email/name; `PATCH /api/users/me/password`. |
| **GDPR-4** | Data minimisation | Only fields strictly needed are stored; no analytics/tracking SDKs. |
| **GDPR-5** | Lawful basis communicated to user | Login page footer states data is handled "in line with GDPR". |
| **GDPR-6** | Crisis-disclosure exemption documented | When a mood log signals crisis, support resources are surfaced — no third-party disclosure. |

---

## 9. Observability

| ID | Requirement | Evidence |
|----|-------------|----------|
| **OBS-1** | Server-side error logs | `console.error(err.stack)` for all 5xx errors. |
| **OBS-2** | Audit trail for sensitive admin actions | `audit_log` table populated by admin/auth controllers. |
| **OBS-3** | Health check endpoint for upstream load balancers | `GET /health` returns 200 with status JSON. |

---

## Out-of-scope NFRs (called out for the marker)

The following are not addressed in the current iteration but are noted as future work:
- **Internationalisation** — UI strings are English-only; no i18n framework.
- **Production monitoring** — no Prometheus / Sentry integration yet.
- **Disaster recovery** — DB backup/restore procedure documented but not automated.
- **Penetration testing** — STRIDE threat model written but no third-party pen-test conducted.
