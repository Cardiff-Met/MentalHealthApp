# Sprint 3 — Polish, Quality, Security Documentation & Deployment

## Assessment Point 3 — Agile and DevOps Phase (40%)
## Assessment Point 4 — Testing, Software Security and Deployment Phase (30%)

---

## 1. Sprint Goal

Sprint 3 closes the project. The functional surface is complete after Sprint 2; Sprint 3 transforms the code into a portfolio-grade artefact by adding the **therapist role** and admin UI, by completing the **accessibility and responsive** pass required for WCAG 2.1 AA, by proving the system's reliability through **client-side unit tests**, **integration tests**, and **attack-vector security tests**, and by producing the **non-functional requirements specification, STRIDE threat model, deployment guide, and incident runbook** that the brief lists for high marks.

By the end of Sprint 3 a marker can read the repository top-to-bottom, run the full test suite, follow the deployment guide on a fresh VPS, and find written evidence for every rubric criterion.

---

## 2. Sprint Backlog

| ID | Story / Task | Priority | Story Points |
|----|--------------|----------|--------------|
| T1 | Therapist role: ENUM, middleware, availability table | Must | 3 |
| T2 | Therapist availability calendar (Mon–Fri × time-of-day grid) | Must | 5 |
| AD4 | Admin dashboard React page (Users / Bookings / Resources tabs) | Must | 5 |
| AD5 | Multi-category resources with per-category colour coding | Should | 3 |
| A1 | WCAG 2.1 AA pass: ARIA, skip link, mobile hamburger, focus rings | Must | 5 |
| TC1 | Vitest + RTL setup; 6+ component tests | Must | 3 |
| TC2 | Login + Mood page tests with mocked auth context | Must | 2 |
| INT1 | Server integration test — full student journey (register → cancel) | Must | 3 |
| SEC1 | SQL-injection / XSS / JWT-tampering attack regression tests | Must | 3 |
| DOC1 | `docs/nfr.md` covering 9 NFR categories with codebase evidence | Must | 3 |
| DOC2 | `docs/threat-model.md` STRIDE matrix (≥12 threats, target 23) | Must | 5 |
| DEP1 | `docker-compose.prod.yml` (env-driven, no exposed DB port, healthchecks) | Must | 3 |
| DEP2 | `docs/deployment.md` end-to-end VPS guide + Nginx + Let's Encrypt | Must | 3 |
| DEP3 | `docs/runbook.md` incident playbook (API/DB down, TLS, breach) | Must | 3 |

**Total committed:** 49 story points

---

## 3. Team Roles and Owner Assignments

| Member | Role | Sprint 3 responsibilities |
|--------|------|---------------------------|
| **Noe** | PO / DevOps | Therapist + admin schema migrations, production compose, deployment guide review |
| **Luca** | QA / CI Lead | Vitest setup, integration & security test suites, NFR + STRIDE write-ups, runbook |
| **Ahmed** | Front-end Dev | Admin dashboard, therapist availability calendar, multi-category resource UI |
| **Abdisamad** | Back-end Dev | Therapist controller + endpoints, role-change endpoint, multi-category storage (JSON column) |

---

## 4. Pull Request Evidence

| PR | Title | Author | Reviewer | Result |
|----|-------|--------|----------|--------|
| #33 | feat: Day 11 — saved resources + My Bookings tab | Ahmed | Luca | Merged |
| #34 | feat: therapist role — availability calendar and booking integration | Abdisamad | Noe | Merged |
| #35 | feat: Day 12 — admin dashboard | Ahmed | Abdisamad | Merged |
| #36 | feat: Day 13 — accessibility and mobile responsiveness | Luca | Ahmed | Merged |
| #37 | feat: Day 14 — Vitest component test suite | Luca | Noe | Merged |
| #38 | docs: NFRs and STRIDE threat model | Luca | Noe | Merged |
| #39 | test: integration journey + attack-vector security suites | Luca | Abdisamad | Merged |
| #40 | feat(deploy): production compose, deployment guide, runbook | Luca | Noe | Merged |

Every PR was rebased onto the latest `main`, passed both CI workflows, and was squash-merged. PR #34 required a non-trivial rebase after Sprint 2's admin work landed; the conflict was resolved by keeping `HEAD` for the controller signature changes and re-targeting the PR to `main`.

---

## 5. Daily Scrum Notes

### Stand-up 1 — Sprint 3 kickoff

| | |
|---|---|
| **Noe** | Yesterday: Drafted Sprint 3 scope around the rubric gaps. Today: Migrations 010 (`users.name`) and 011 (`resources.categories JSON`). Blocker: None. |
| **Luca** | Yesterday: Sprint 2 retro. Today: Vitest install + jsdom config; first 5 component tests for `Button`, `Card`, `EmptyState`, `ErrorBanner`, `LoadingSpinner`. Blocker: None. |
| **Ahmed** | Yesterday: Reviewed multi-category UX with Noe. Today: Admin Users tab — table, role badge, role dropdown, self-edit guard. Blocker: None. |
| **Abdisamad** | Yesterday: Schema changes merged. Today: Therapist controller (`GET /slots`, `POST /slots`, `DELETE /slots/:id`); rolling the JOIN into `getSlots`. Blocker: None. |

### Stand-up 2 — Mid-sprint

| | |
|---|---|
| **Noe** | Yesterday: Reviewed PR #36 (a11y). Today: Drafting `docker-compose.prod.yml` with secrets-from-env; reviewing PR #38 (NFR + STRIDE). Blocker: None. |
| **Luca** | Yesterday: 29 Vitest tests green; STRIDE matrix at 23 threats. Today: Writing `user-journey.test.js` (7-step chained integration test) and `attacks.test.js` (8 attack-vector regression tests). Blocker: None. |
| **Ahmed** | Yesterday: Admin Bookings + Resources tabs merged. Today: Multi-category chips with per-category colour palette. Blocker: None. |
| **Abdisamad** | Yesterday: Role-change endpoint merged. Today: Reviewing PR #39 (integration + security tests); helping Luca verify the SQL-injection assertions hit the real parameterised path. Blocker: None. |

### Stand-up 3 — Sprint close

| | |
|---|---|
| **Noe** | Yesterday: Reviewed PR #40 (deployment + runbook). Today: Final read-through of `docs/deployment.md`; sanity-checking the rubric-to-evidence mapping for the PDF. Blocker: None. |
| **Luca** | Yesterday: 139 server-side tests, 29 client-side, all green. Today: Sprint 2 / Sprint 3 retro docs and Week 10 refresh. Blocker: None. |
| **Ahmed** | Yesterday: Categorisation pass on the seeded resources. Today: Manual a11y check with screen reader + keyboard-only navigation across all eight pages. Blocker: None. |
| **Abdisamad** | Yesterday: Reviewed all open PRs. Today: Final smoke test in Docker; verifying `npm test` and `docker compose -f docker-compose.prod.yml config` both succeed cleanly. Blocker: None. |

---

## 6. Definition of Done

Same as Sprint 2 (lint clean, CI green, peer-reviewed, squash-merged) **plus**:

7. New documentation cross-referenced in `README.md` so a marker can find it without grepping.
8. Every test file ends with a green run on the author's machine before push.

---

## 7. Sprint Review Summary

All 49 committed points were delivered (PR #40 merged on the final review day). The repository now contains:

- **159 automated tests** (139 server-side, 29 client-side, 1 attack-vector suite, 1 integration journey).
- A **complete admin dashboard** (Users, Bookings, Resources) and a **therapist availability calendar**.
- A **WCAG 2.1 AA accessibility pass** (skip link, ARIA roles, mobile hamburger, focus management) verified manually with VoiceOver and keyboard-only navigation.
- A **production-grade Docker Compose configuration**, **deployment guide**, and **incident runbook**.
- **`nfr.md`** covering nine non-functional requirement categories with codebase evidence.
- **`threat-model.md`** — STRIDE matrix across Client / API / Auth / DB with 23 catalogued threats and residual-risk classification.

**Velocity:** 49 story points (Sprint 1: 23; Sprint 2: 41; Sprint 3: 49). The accelerating velocity reflects the design-system investment from Sprint 2 paying off and the team's familiarity with the codebase.

---

## 8. Sprint Retrospective

### What went well
- **Luca on solo doc duty** while the others wrote code parallelised the sprint cleanly — the security/NFR docs progressed without blocking front-end work.
- **The Vitest setup paid for itself within a day**: PR #36's accessibility refactor would have been risky to merge without component-level regression tests around the radio group and the error banner.
- **STRIDE threat model exceeded the rubric requirement** (23 threats vs the brief's implied minimum of 12) and surfaced four concrete follow-ups now logged for any future iteration.
- **Production compose file has zero literal secrets** — every value is `${VAR}` and `.env.prod` is git-ignored.

### What did not go well
- **`feature/day-13-accessibility` initially failed CI** on a Prettier formatting check in the test file — the cost was a 30-minute round-trip on the PR. A pre-push hook would prevent recurrence.
- **One stale PR check** (`/api/admin/users` returning 403 in the integration test) revealed that the `requireAdmin` middleware ordering was implicit on route registration order; the test made the contract explicit and was kept.
- **PR #34 (therapist role)** required re-targeting and a merge-from-main because the rebase base shifted under it — a non-blocking but instructive incident.

### Action items for any future iteration
1. Add a `pre-push` hook running `npm run format:check && npm run lint` so the Prettier failure cannot reach CI.
2. Add `husky` + `lint-staged` so the hook is committed-with-the-repo rather than per-machine.
3. Wire `npm test` into the same hook for the Server package — it runs in 8 s, well inside the budget.
4. Schedule a quarterly STRIDE review against the live threat landscape; bcrypt cost factor in particular needs a periodic review.

### Carried to backlog (post-portfolio)
- Convert `localStorage` access tokens to in-memory only (closes STRIDE C1 residual-medium risk).
- Account-lockout after N failed logins (closes STRIDE A2).
- Bump bcrypt cost factor from 10 to 12 (closes STRIDE AU4).
- Encrypted off-site DB backups (closes STRIDE D3).
- Monitoring stack (Prometheus + Grafana, Sentry).
