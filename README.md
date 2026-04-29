# 🧠 MindSpace — Mental Health Support App

A full-stack web application providing personalised mental health support for Cardiff Met students, built as part of SEN5002 Agile Development and DevOps.

[![Code Quality Checks](https://github.com/Cardiff-Met/MentalHealthApp/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Cardiff-Met/MentalHealthApp/actions)
[![Docker Build & Test](https://github.com/Cardiff-Met/MentalHealthApp/actions/workflows/docker-test.yml/badge.svg)](https://github.com/Cardiff-Met/MentalHealthApp/actions)

---

## 🌟 Features

### Core
- **Mood Tracking** — Log daily mood (1–5 scale) with optional notes
- **Mood History** — 30-day trend chart (Recharts line graph)
- **Crisis Detection** — Automatic crisis resources when mood = 1
- **Resource Library** — Curated mental health resources with category filtering and save-for-later
- **Therapy Booking** — Browse slots, book appointments, view booking status

### User Account
- **Profile Management** — Update name, email, change password
- **GDPR Data Export** — Download all personal data as JSON
- **Account Deletion** — Soft-delete with mood log anonymisation (GDPR Right to Erasure)
- **Password Reset** — Secure token-based reset flow (SHA-256 hashed, 30-min expiry, single-use)

### Role-Based Access
- **Admin Dashboard** — Manage users (assign roles), manage resources, confirm/decline bookings
- **Therapist Calendar** — Add/remove availability slots with conflict detection and past-date guards

### Security & Compliance
- **Helmet** — HTTP security headers on every response
- **Rate Limiting** — 5 req/15 min on auth routes, 100 req/15 min general
- **Audit Log** — Append-only log of login, logout, password changes, account deletion, admin actions
- **STRIDE Threat Model** — 23 threats analysed; see [`docs/threat-model.md`](./docs/threat-model.md)
- **Accessibility** — ARIA landmarks, skip link, focus rings, mobile nav (WCAG 2.1 AA)

---

## 🛠️ Tech Stack

### Frontend (Client)
| Technology | Purpose |
|-----------|---------|
| React 19 | UI library |
| Vite | Build tool & dev server |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Styling |
| Recharts | Mood history chart |
| Vitest + Testing Library | Component & page tests |
| ESLint + Prettier | Code quality |

### Backend (Server)
| Technology | Purpose |
|-----------|---------|
| Node.js 20 + Express 5 | REST API |
| MySQL 8 | Relational database |
| JWT (jsonwebtoken) | Access + refresh token auth |
| bcrypt | Password hashing |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Swagger / OpenAPI | Interactive API docs |
| Jest + Supertest | API & integration tests |
| ESLint + Prettier | Code quality |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerisation (dev & prod) |
| GitHub Actions | CI/CD — lint, format, test, Docker smoke test |

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [Node.js 20+](https://nodejs.org/) (optional — only needed for local dev without Docker)

### 1. Clone the Repository
```bash
git clone git@github.com:Cardiff-Met/MentalHealthApp.git
cd MentalHealthApp
```

### 2. Set Up Environment Variables
```bash
cp Server/.env.example Server/.env
# Edit Server/.env and set JWT_SECRET and REFRESH_SECRET (min 32 chars each)
```

### 3. Start with Docker Compose
```bash
docker compose up --build
```

This starts:
- **MySQL Database** on port 3306 (schema + seed data applied automatically)
- **Express API Server** on port 3000

### 4. Start the Client (separate terminal)
```bash
cd Client
npm install
npm run dev
```

The app is available at: **http://localhost:5173**  
Swagger API docs: **http://localhost:3000/api-docs**

### Default Admin Account
```
Email:    admin@cardiffmet.ac.uk
Password: Admin1234!
```

---

## 📁 Project Structure

```
MentalHealthApp/
├── .github/workflows/
│   ├── code-quality.yml        # ESLint + Prettier + Server tests + coverage
│   └── docker-test.yml         # Docker build & smoke test
│
├── Client/                     # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/         # AppShell, Button, Card, EmptyState, ErrorBanner, LoadingSpinner
│   │   ├── pages/              # 9 pages: Login, Dashboard, Mood, MoodHistory, Resources,
│   │   │                       #          Booking, Profile, Therapist, Admin
│   │   ├── context/            # AuthContext, useAuth hook
│   │   └── App.jsx
│   └── test/                   # Vitest + Testing Library tests
│
├── Server/                     # Express 5 REST API
│   ├── src/
│   │   ├── controllers/        # auth, mood, resources, booking, user,
│   │   │                       # passwordReset, therapist, admin
│   │   ├── routes/             # 7 route files
│   │   ├── middleware/         # authenticateToken, requireAdmin, requireTherapist
│   │   ├── db/                 # connection.js, schema.sql, migrate.js (11 migrations)
│   │   ├── utils/              # validation.js, audit.js
│   │   └── __tests__/          # 14 test suites — 164 tests
│   └── Dockerfile              # Multi-stage alpine, npm ci, non-root user, HEALTHCHECK
│
├── docs/
│   ├── nfr.md                  # Non-functional requirements (9 categories)
│   ├── threat-model.md         # STRIDE threat analysis (23 threats)
│   ├── deployment.md           # VPS deployment guide (Nginx + Let's Encrypt)
│   ├── runbook.md              # 5 incident scenarios with diagnose/recover steps
│   ├── GithubActions.md        # CI/CD pipeline documentation
│   ├── sprint02.md             # Sprint 2 goals, stand-ups, PRs, retro
│   ├── sprint03.md             # Sprint 3 goals, stand-ups, PRs, retro
│   ├── baseline-metrics.md     # Performance baselines
│   └── Server.md / Client.md  # API & frontend docs
│
├── docker-compose.yml          # Dev orchestration
├── docker-compose.prod.yml     # Production orchestration
└── .env.prod.example           # Production env template
```

---

## 🧪 Testing

### Run the full server test suite
```bash
cd Server
npm test
```

Expected output:
```
Test Suites: 14 passed, 14 total
Tests:       164 passed, 164 total
```

### Run with coverage
```bash
cd Server
npm run test -- --coverage
```

### Run client tests
```bash
cd Client
npm test
```

### Test suite overview

| Suite | Tests | Type | What it covers |
|-------|-------|------|----------------|
| `validation.test.js` | 21 | Unit | Email, password, mood rating validators |
| `auth.middleware.test.js` | 7 | Unit | JWT authentication middleware |
| `requireAdmin.middleware.test.js` | 5 | Unit | Admin role guard |
| `requireTherapist.middleware.test.js` | 6 | Unit | Therapist role guard |
| `audit.util.test.js` | 6 | Unit | Audit log writer |
| `mood.feature.test.js` | 17 | Functional | Register → Login → Log Mood → Resources |
| `user.feature.test.js` | 14 | Functional | Profile, GDPR export, change password, delete account |
| `passwordReset.feature.test.js` | 9 | Functional | Forgot password → reset flow |
| `savedResources.feature.test.js` | 14 | Functional | Save/unsave resources |
| `admin.feature.test.js` | 22 | Functional | User management, resource CRUD, booking confirm/decline |
| `therapist.feature.test.js` | 13 | Functional | Add/remove slots, conflict detection, bookings |
| `security.test.js` | 14 | Security | XSS and SQL injection prevention |
| `security/attacks.test.js` | 9 | Security | JWT tampering, role escalation, mass-assignment |
| `integration/user-journey.test.js` | 7 | Integration | End-to-end user journey |
| **Total** | **164** | | |

All functional and integration tests use **supertest** to send real HTTP requests through the full Express stack. Database and bcrypt are mocked — no live MySQL needed.

---

## 🔐 Security

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt (cost 10) |
| Access tokens | JWT, 15-min expiry |
| Refresh tokens | JWT, 7-day expiry, httpOnly + sameSite strict cookies |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | 5 req/15 min on `/api/auth/*`; 100 req/15 min global |
| Body size cap | 100 KB — mitigates payload flooding |
| Password policy | ≥8 chars, must include letter + digit |
| JWT secret enforcement | Fails fast if `JWT_SECRET` < 32 chars |
| SQL injection | Parameterised queries throughout |
| Audit log | Append-only `audit_log` table — login, logout, password changes, admin actions |
| GDPR | Soft-delete with data anonymisation; full data export endpoint |
| Threat model | STRIDE analysis — see [`docs/threat-model.md`](./docs/threat-model.md) |

---

## 🗄️ Database Schema

Seven tables with idempotent runtime migrations (`migrate.js`):

| Table | Purpose |
|-------|---------|
| `users` | Accounts — email, bcrypt hash, role, soft-delete |
| `mood_logs` | Mood entries (rating 1–5, optional description) |
| `resources` | Curated mental health resources with category + mood range |
| `saved_resources` | User ↔ resource saves |
| `therapy_slots` | Therapist availability slots |
| `bookings` | Booking requests with status (pending/confirmed/declined) |
| `password_resets` | Hashed reset tokens with expiry and used-at timestamp |
| `audit_log` | Append-only security event log |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `user` | Mood logging, resource browsing, booking, profile/GDPR |
| `therapist` | All user access + manage own availability slots |
| `admin` | All access + user role management, resource CRUD, booking confirm/decline |

---

## ⚙️ CI/CD

Every push and pull request triggers two workflows:

**Code Quality** (`code-quality.yml`)
- ESLint on Client + Server
- Prettier format check on Client + Server
- Jest test suite with coverage upload

**Docker Build & Test** (`docker-test.yml`)
- Builds the production Docker image
- Starts full docker-compose stack (API + MySQL)
- Waits for DB schema initialisation
- Smoke-tests `/health`, `/api/auth/register`, `/api/auth/login`

See [`docs/GithubActions.md`](./docs/GithubActions.md) for full pipeline documentation.

---

## 🔧 Development

### Local development (without Docker)

**Server**
```bash
cd Server
npm install
# Copy and fill in Server/.env (see Server/.env.example)
npm run dev        # nodemon — auto-restarts on changes, port 3000
```

**Client**
```bash
cd Client
npm install
npm run dev        # Vite HMR, port 5173
```

### Code quality scripts

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format:check
npm run format
```

### Docker commands

```bash
docker compose up --build       # Build and start
docker compose down             # Stop
docker compose down -v          # Stop and wipe volumes (fresh DB)
docker compose logs server      # Server logs
docker compose logs db          # DB logs
docker compose ps               # Container status
```

---

## 🌍 Environment Variables

Copy `Server/.env.example` to `Server/.env` and fill in:

```env
PORT=3000
CLIENT_URL=http://localhost:5173

DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-db-password
DB_NAME=mental_health_app

JWT_SECRET=<min-32-char-random-string>
REFRESH_SECRET=<min-32-char-random-string>
NODE_ENV=development
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`docs/nfr.md`](./docs/nfr.md) | Non-functional requirements with codebase evidence |
| [`docs/threat-model.md`](./docs/threat-model.md) | STRIDE threat analysis (23 threats) |
| [`docs/deployment.md`](./docs/deployment.md) | VPS deployment guide — Nginx, Let's Encrypt, backups |
| [`docs/runbook.md`](./docs/runbook.md) | Incident response — 5 scenarios with diagnose/recover steps |
| [`docs/GithubActions.md`](./docs/GithubActions.md) | CI/CD pipeline documentation |
| [`docs/sprint02.md`](./docs/sprint02.md) | Sprint 2 summary and retrospective |
| [`docs/sprint03.md`](./docs/sprint03.md) | Sprint 3 summary and retrospective |
| [`docs/Server.md`](./docs/Server.md) | API endpoint reference |
| [`docs/Client.md`](./docs/Client.md) | Frontend structure and setup |

---

## ♿ Accessibility

- Skip-to-main-content link
- ARIA landmarks and labels throughout
- Focus rings on all interactive elements
- Mobile-responsive hamburger navigation
- Lazy-loaded heavy pages to maintain performance

---

## 🐛 Troubleshooting

**Containers won't start:**
```bash
docker compose down -v
docker compose up --build
```

**Can't connect to the database:**
- Check port 3306 is free: `docker compose ps`
- Verify `Server/.env` has correct `DB_*` values

**Server crashes on startup:**
```bash
docker compose logs server
# Common cause: JWT_SECRET missing or < 32 chars
```

**CI format check failing:**
```bash
cd Server && npm run format
cd ../Client && npm run format
git add -A && git commit -m "style: fix formatting"
```

---

## 📞 Crisis Support Resources

**If you or someone you know needs support:**
- **Samaritans**: 116 123 (24/7, free)
- **NHS Urgent Mental Health**: 111 (option 2)
- **Cardiff Met Wellbeing**: [cardiffmet.ac.uk/wellbeing](https://www.cardiffmet.ac.uk/wellbeing)

---

## 📝 Licence

Cardiff Metropolitan University coursework — SEN5002 Agile Development and DevOps.
