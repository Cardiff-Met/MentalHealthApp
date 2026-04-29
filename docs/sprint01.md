# Sprint 1 — MVP: Authentication, Mood Tracking, Booking & Crisis Detection

## Assessment Point 3 — Agile and DevOps Phase (40%)

---

## 1. Sprint Goal

Sprint 1 delivers the four Must-Have features identified during the Week 4 prioritisation workshop: **secure authentication**, **mood tracking with personalised resources**, **therapy session booking**, and **crisis detection**. The sprint transforms the Week 1–4 planning artefacts (personas, user stories, acceptance criteria) into a working, containerised full-stack application that a Cardiff Met student can register on, log a mood, and book a therapy slot.

By the end of Sprint 1 a student can register, log in, log a mood and receive personalised resources (including an automatic crisis panel at mood = 1), browse and book an available therapy slot, and view their booking status.

---

## 2. Sprint Backlog

The Sprint 1 backlog implements the four Must-Have features (F1–F4) identified in the Week 4 prioritisation. Stories are drawn directly from the Week 4 backlog.

| ID | Story | Persona | Priority | Story Points |
|----|-------|---------|----------|--------------|
| E3 | Register with email and password | Emily | Must | 2 |
| E4 | Log in securely with JWT session | Emily | Must | 2 |
| E1 | Log mood with rating (1–5) and optional description | Emily | Must | 2 |
| E2 | Receive personalised resource recommendations after mood log | Emily | Must | 2 |
| S1 | Auto crisis panel when mood = 1 | Sophie | Must | 2 |
| S2 | Emergency contacts displayed on crisis panel | Sophie | Must | 1 |
| D1 | Browse available therapy slots | Daniel | Must | 2 |
| D2 | Submit a booking request | Daniel | Must | 3 |
| D3 | View booking status (Pending / Confirmed / Declined) | Daniel | Must | 2 |
| A1 | Browse resources without initiating a booking | Aisha | Must | 1 |
| INF1 | Project scaffold: Vite + React + Tailwind + ESLint + Prettier | All | Must | 1 |
| INF2 | Server scaffold: Express + MySQL + Docker Compose + JWT | All | Must | 2 |
| INF3 | GitHub Actions: code-quality + docker-test CI pipelines | All | Must | 1 |

**Total committed:** 23 story points

---

## 3. Team Roles and Owner Assignments

| Member | Role | Sprint 1 responsibilities |
|--------|------|---------------------------|
| **Noe** | Product Owner / DevOps Lead | Backlog prioritisation, database schema design, Docker Compose setup, PR triage |
| **Luca** | QA / CI Lead | GitHub Actions pipelines, Jest + supertest test suites (`validation`, `auth.middleware`, `mood.feature`), code review |
| **Ahmed** | Front-end Dev | React scaffold, Login page, Dashboard, Mood page, Resources page, Booking page |
| **Abdisamad** | Back-end Dev | Express scaffold, `authController`, `moodController`, `resourcesController`, `bookingController` |

---

## 4. Pull Request Evidence

Sprint 1 was delivered across the following merged commits and PRs against `main`. The branching policy was established mid-sprint; early infrastructure commits were made directly to `main` before the policy was agreed.

| Commit / PR | Title | Author | Result |
|-------------|-------|--------|--------|
| `9ca98c0` | feat(init): set up React project with Vite, Tailwind, ESLint, Prettier | Ahmed | Merged to main |
| `de2dddf` | feat(init): setup server with Express, MySQL, Docker Compose, JWT auth | Abdisamad | Merged to main |
| `c0b9252` | feat: implement MVP features — auth, resource browsing, booking | Abdisamad | Merged to main |
| `ee98e45` | feat: add authentication context, mood logging, booking pages | Ahmed | Merged to main |

**Note:** Direct commits to `main` were identified in the Sprint 1 retrospective as a process gap. From Sprint 2 onward all changes were delivered via feature branches and reviewed pull requests.

---

## 5. Daily Scrum Notes

Stand-ups were held at the start of each work session via the team Discord channel. Three representative stand-ups are reproduced below.

### Stand-up 1 — Sprint kickoff

| | |
|---|---|
| **Noe** | Yesterday: Week 4 backlog finalised and story points assigned. Today: Database schema for `users`, `mood_logs`, `resources`, `therapy_slots`, `bookings`; Docker Compose config. Blocker: None. |
| **Luca** | Yesterday: Reviewed Week 4 acceptance criteria for testability. Today: Setting up GitHub Actions `code-quality.yml` pipeline; scaffolding Jest config. Blocker: None. |
| **Ahmed** | Yesterday: Reviewed Vite + React + Tailwind setup docs. Today: Project scaffold — Vite, Tailwind, ESLint, Prettier, React Router; Login page skeleton. Blocker: None. |
| **Abdisamad** | Yesterday: Agreed API contract with Ahmed. Today: Express scaffold, `authController` register + login endpoints, bcrypt hashing. Blocker: None. |

### Stand-up 2 — Mid-sprint

| | |
|---|---|
| **Noe** | Yesterday: MySQL schema applied; Docker Compose health-check working. Today: `docker-test.yml` CI pipeline; seed data for resources and therapy slots. Blocker: MySQL container startup race — resolved with `service_healthy` condition. |
| **Luca** | Yesterday: `code-quality.yml` green. Today: Writing `validation.test.js` (TDD — 21 unit tests before validators were written); `auth.middleware.test.js`. Blocker: None. |
| **Ahmed** | Yesterday: Login page complete with JWT storage. Today: Dashboard, Mood page (1–5 scale, description field, crisis panel at mood = 1). Blocker: None. |
| **Abdisamad** | Yesterday: Auth endpoints complete and tested. Today: `moodController` (log mood, crisis detection), `resourcesController` (filter by mood range). Blocker: None. |

### Stand-up 3 — Sprint close

| | |
|---|---|
| **Noe** | Yesterday: Seed data merged. Today: Final smoke-test of all four features end-to-end via Docker Compose. Blocker: None. |
| **Luca** | Yesterday: `mood.feature.test.js` complete (17 tests — Register → Login → Log Mood → Resources pathway). Today: CI green on all four jobs; preparing Sprint 1 retro. Blocker: None. |
| **Ahmed** | Yesterday: Booking page and Resources page complete. Today: Final styling pass; verifying crisis panel renders at mood = 1. Blocker: None. |
| **Abdisamad** | Yesterday: `bookingController` and `resourcesController` complete. Today: Reviewing Ahmed's front-end PRs; checking parameterised queries throughout. Blocker: None. |

---

## 6. Definition of Done

A story was considered Done when:

1. All acceptance criteria from the Week 4 backlog were met.
2. Server-side endpoints had Jest + supertest coverage or a documented reason for deferral.
3. ESLint and Prettier passed (`npm run lint`, `npm run format:check`).
4. Both `code-quality.yml` and `docker-test.yml` were green.
5. The feature was manually smoke-tested end-to-end via Docker Compose.

---

## 7. Sprint Review Summary

All 23 committed story points were delivered. The application is running end-to-end in Docker Compose: a student can register, log a mood, receive personalised resources (including the crisis panel at mood = 1), browse available therapy slots, submit a booking request, and view their booking status.

The CI pipeline (`code-quality.yml` + `docker-test.yml`) was established during this sprint and has remained green throughout. The Jest suite covers all core server-side logic with 50 passing tests across three suites.

**Velocity:** 23 story points (first sprint — baseline established for Sprint 2 planning).

---

## 8. Sprint Retrospective

### What went well
- **TDD on validators** — Luca wrote `validation.test.js` before the validator functions existed; this caught three edge cases (empty string, whitespace-only email, digit-only password) before any controller used the validators.
- **Docker Compose from day one** — containerising the database in the first commit meant the whole team developed against an identical environment; no "works on my machine" issues.
- **GitHub Actions CI** — having the pipeline in place from the first push meant every breaking change was flagged within minutes rather than discovered at demo time.
- **Clear API contract** — Ahmed and Abdisamad agreed the request/response shapes for all four features before either started coding, which eliminated the most common front-end/back-end integration friction.

### What did not go well
- **Direct commits to `main`** — the first four commits landed directly on `main` before the team agreed a branching policy. Two of these commits accidentally included `Server/.env` in tracked files, creating a credential exposure that required a git history rewrite later.
- **No PR review process** in the first week — the team agreed post-sprint that all changes from Sprint 2 onward must go through a reviewed pull request before merging.
- **Story point estimation** — the infrastructure stories (INF1–INF3) were underestimated; the Docker Compose health-check alone consumed half a day resolving the MySQL startup race condition.

### Action items for Sprint 2
1. Establish and document the branching policy: all changes via `feature/<slug>` branches, reviewed PRs, squash-merge.
2. Add `.env` to `.gitignore` immediately; add `.env.example` as a template.
3. Carry saved resources (A4) and booking cancellation (D4) into Sprint 2 — both were identified as Should-Have but did not fit Sprint 1 scope.
4. Add integration coverage: Sprint 1 ends with unit + functional tests but no end-to-end journey test; address in Sprint 2 or Sprint 3.

### Carried to Sprint 2
- Saved resources (A4 — Should Have)
- Booking cancellation (D4 — Should Have)
- Profile management and GDPR controls (U1–U5)
- Password reset flow (P1, P2)
- Security hardening (helmet, rate limiting, cookie flags)
- Admin role and API (AD1–AD3)
- Shared component design system (AppShell, Card, Button, etc.)
