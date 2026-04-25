# STRIDE Threat Model — MindSpace

This document applies the **STRIDE** classification (Spoofing, Tampering, Repudiation, Information disclosure, Denial of Service, Elevation of privilege) to each major component of the MindSpace platform. For every threat we record:

- The **attack scenario**
- The **mitigation already in place** in the codebase
- The **residual risk** (Low / Medium / High) — what could still go wrong

---

## 1. System decomposition

The application is a 3-tier system with the following trust boundaries (TB):

```
┌─────────────────────┐        TB-1 (HTTPS, CORS)        ┌──────────────────┐
│  Client (React SPA) │ ───────────────────────────────► │  API (Express)   │
│  - Browser context  │                                  │  - Express 5     │
│  - localStorage     │                                  │  - JWT auth      │
└─────────────────────┘                                  │  - helmet        │
                                                         │  - rate-limit    │
                                                         └────────┬─────────┘
                                                                  │ TB-2 (DB socket, internal)
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  MySQL 8         │
                                                         │  - Docker volume │
                                                         └──────────────────┘
```

**Trust boundaries:**
- **TB-1** — Public Internet → API (untrusted user input, hostile network).
- **TB-2** — API → DB (trusted within Docker network, but app code may still pass tainted data).

**Assets being protected:**
- A1 — User credentials (password hashes, JWTs, refresh tokens)
- A2 — Mood-log entries (special-category personal data under GDPR Art. 9)
- A3 — Booking records linking students to therapists
- A4 — Admin/therapist privileges (role escalation = unauthorised data access)

---

## 2. Threat catalogue

Per the brief's expectation of ≥ 12 threats, below is the full STRIDE matrix across the four components.

### 2.1 Client (React SPA)

| # | Category | Threat | Mitigation | Residual |
|---|----------|--------|------------|----------|
| C1 | **S**poofing | Attacker steals access token from `localStorage` via a third-party script, then impersonates the user. | No third-party scripts loaded; CSP via `helmet` defaults; refresh token in HTTP-only cookie so even XSS cannot exfiltrate it. | **Medium** — `localStorage` exposure remains if a future XSS is introduced. |
| C2 | **T**ampering | Attacker modifies request bodies in flight to escalate privileges (e.g. `role: 'admin'`). | All authorisation decisions are server-side; client-supplied role is ignored on register; admins are set only via `/api/admin/users/:id/role`. | Low |
| C3 | **I**nformation disclosure | Sensitive fields (e.g. mood description) leak via browser history or shared URL. | All sensitive data fetched via authenticated API calls — no GET parameters carry it. | Low |

### 2.2 API (Express)

| # | Category | Threat | Mitigation | Residual |
|---|----------|--------|------------|----------|
| A1 | **S**poofing | Attacker forges a JWT to authenticate as another user. | JWT signed with HS256 using ≥ 32-char `JWT_SECRET`; bootstrap fails fast if secret is short/missing (`app.js`). | Low |
| A2 | **S**poofing | Credential stuffing / brute-force against `/api/auth/login`. | `express-rate-limit` — 5 requests / 15 min per IP on `/api/auth/*`. | **Medium** — distributed botnets can defeat IP-based limits; future work: account lockout + CAPTCHA. |
| A3 | **T**ampering | SQL injection through any user-controlled parameter. | All queries parameterised via `mysql2` placeholders — never string concatenation. Confirmed by code review. | Low |
| A4 | **T**ampering | Mass-assignment / over-posting (e.g. POST `{role: 'admin'}` to register). | Controllers explicitly destructure expected fields only; the register endpoint never reads `role` from the request body. | Low |
| A5 | **R**epudiation | An admin denies having changed another user's role or deleted a booking. | `audit_log` table records `user_id`, `action`, `ip`, `user_agent`, `created_at` for sensitive operations. | **Medium** — log is in the same DB it audits; offsite log shipping is out of scope. |
| A6 | **I**nformation disclosure | Stack traces leak internals on a 500 error. | Global error handler returns generic `"Internal server error"` for status ≥ 500; full stack only in `console.error`. | Low |
| A7 | **I**nformation disclosure | Detailed error message reveals whether an email exists ("user not found" vs "wrong password"). | Both branches return the same generic `"Invalid credentials"` response. | Low |
| A8 | **D**oS | Attacker sends very large JSON bodies to exhaust memory. | `express.json({ limit: '100kb' })` rejects oversize payloads with HTTP 413. | Low |
| A9 | **D**oS | Attacker floods the API with cheap requests. | Global limiter — 100 requests / 15 min per IP. | **Medium** — does not stop a Layer-7 DDoS; production deployment would sit behind Cloudflare / WAF. |
| A10 | **E**levation of privilege | A student calls an admin-only endpoint and is granted access. | `requireAdmin` / `requireTherapist` middleware re-validates role from the verified JWT — never trusts request body. | Low |
| A11 | **E**levation of privilege | A user changes another user's password via `PATCH /api/users/me/password`. | Endpoint always operates on the JWT subject (`req.user.id`); never accepts a target user id. Current password is required. | Low |

### 2.3 Authentication & session layer

| # | Category | Threat | Mitigation | Residual |
|---|----------|--------|------------|----------|
| AU1 | **S**poofing | Refresh token theft via XSS. | Refresh token stored in HTTP-only, SameSite=strict, secure cookie — unreachable from JS. | Low |
| AU2 | **T**ampering | Replay of an old / leaked access token after logout. | Access tokens are short-lived (15 min); refresh tokens are revoked on logout / password change. | **Medium** — within the 15-min window a leaked access token is usable; rotation on each refresh is in place. |
| AU3 | **R**epudiation | User claims they did not log in from a particular location. | `audit_log` records IP + user agent on every login. | Low |
| AU4 | **I**nformation disclosure | Password hashes leak from a DB dump. | `bcrypt` cost factor 10 — brute force is computationally expensive even with the hash. | **Medium** — cost should be raised to 12+ as hardware improves. |
| AU5 | **E**levation of privilege | An admin's password reset token is intercepted. | Tokens are stored as SHA-256 hashes in `password_resets`; one-time use; expire after 30 minutes. | Low |

### 2.4 Database (MySQL 8)

| # | Category | Threat | Mitigation | Residual |
|---|----------|--------|------------|----------|
| D1 | **S**poofing | An attacker reaches MySQL directly bypassing the API. | DB binds only to the internal Docker network; no port published in production compose file. | Low |
| D2 | **T**ampering | Application bug allows writes through unparameterised SQL. | All controllers use `mysql2` placeholders; ESLint + code review enforce. | Low |
| D3 | **I**nformation disclosure | DB volume backup is leaked from the host. | Out of scope of the application, but `docker-compose.yml` does not expose the volume publicly; production would require encryption-at-rest on the host. | **High** — explicit gap; documented in NFR §9 as future work. |
| D4 | **D**oS | Slow/expensive queries from one user starve other users. | Mood/booking/resources endpoints all query indexed columns; rate limiter caps request rate per IP. | Low |

---

## 3. Summary

- **Total threats catalogued:** 23 (target was ≥ 12)
- **High residual risk:** 1 (DB backup confidentiality — outside application scope)
- **Medium residual risk:** 6 (mostly require infrastructure-level controls or advanced anti-abuse)
- **Low residual risk:** 16

### Priority follow-up actions

1. Move access tokens from `localStorage` to in-memory only + secure cookie pattern (closes C1).
2. Add account lockout after N failed logins to harden against distributed brute-force (closes A2).
3. Bump bcrypt cost factor to 12 once average login latency budget allows (closes AU4).
4. Document and automate encrypted DB backups in the deployment guide (closes D3).

---

## 4. References

- Microsoft, *The STRIDE Threat Model*, learn.microsoft.com.
- OWASP, *Application Security Verification Standard v4*, §2 (Auth) and §5 (Validation).
- OWASP Top 10 (2021) — A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A07 ID & Auth Failures.
- ICO, *Data security incident trends*.
