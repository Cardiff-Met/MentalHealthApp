# Sprint 2 — Account Control, Security Hardening & Admin

## Assessment Point 3 — Agile and DevOps Phase (40%)

---

## 1. Sprint Goal

Sprint 2 builds on the MVP delivered in Sprint 1 by closing the gaps that turn a demo into a defensible product: **GDPR-compliant account control**, **password recovery**, **security hardening**, and the **admin role** with its API surface. Where Sprint 1 proved the team could ship the four Must-Have features end-to-end, Sprint 2 demonstrates that the team can also harden, audit, and govern that feature set.

By the end of Sprint 2 a student can register, recover a forgotten password, manage their profile, export or delete their personal data, and the wellbeing team can administer users and review bookings via the API.

---

## 2. Sprint Backlog

The Sprint 2 backlog promotes Should-Have stories from the Week 4 prioritised backlog and adds the cross-cutting hardening work required to satisfy the brief's "Software Security Check" deliverable.

| ID | Story | Persona | Priority | Story Points |
|----|-------|---------|----------|--------------|
| U1 | View my profile (id, email, role, joined date) | Aisha / Marcus | Must | 1 |
| U2 | Update my email and name | All | Should | 2 |
| U3 | Change my password (current password required) | All | Must | 2 |
| U4 | Delete my account (GDPR Right to Erasure) | All | Must | 3 |
| U5 | Export all my data as JSON (GDPR Portability) | All | Must | 2 |
| P1 | Request a password reset link | All | Must | 3 |
| P2 | Reset password using a one-time token | All | Must | 3 |
| R1 | Save a resource for later | Aisha (A4) | Should | 2 |
| R2 | Filter resources by category | Marcus | Could | 2 |
| B1 | Cancel my own pending booking | Daniel | Should | 2 |
| S1 | Strengthen password policy (letter + digit, ≥8 chars) | All | Must | 1 |
| S2 | Helmet security headers + 100 KB body size limit | All | Must | 1 |
| S3 | Rate-limit `/api/auth/*` (5 / 15 min) | All | Must | 2 |
| S4 | Tighten cookie flags (HttpOnly, SameSite=Strict) | All | Must | 1 |
| AD1 | `users.role` ENUM (`student`, `admin`) + `requireAdmin` middleware | Wellbeing team | Must | 2 |
| AD2 | Admin: list / soft-delete users | Wellbeing team | Must | 3 |
| AD3 | Admin: list bookings + confirm/decline | Wellbeing team | Must | 3 |
| UI1 | Shared `AppShell`, `Card`, `Button`, `ErrorBanner`, `LoadingSpinner` | All | Must | 2 |
| UI2 | Profile page (view + edit + delete + export) | All | Must | 3 |
| UI3 | Mood history page with chart (`recharts`) | Emily | Should | 3 |

**Total committed:** 41 story points

---

## 3. Team Roles and Owner Assignments

| Member | Role | Sprint 2 responsibilities |
|--------|------|---------------------------|
| **Noe** | Product Owner / DevOps | Backlog grooming, schema migrations (010 / role column / soft delete / audit log), PR triage |
| **Luca** | QA / CI Lead | Server-side Jest suites for every new endpoint, CI pipeline maintenance, code review |
| **Ahmed** | Front-end Dev | `AppShell`, design tokens, shared components, Profile page, Mood history page |
| **Abdisamad** | Back-end Dev | `userController` + `passwordResetController` + `adminController`; security middleware (helmet, rate-limit) |

---

## 4. Pull Request Evidence

Sprint 2 was delivered across the following merged PRs against `main`. Every PR was reviewed by at least one team member who did not author it, passed both CI workflows, and was merged via squash-merge.

| PR | Title | Author | Reviewer | Result |
|----|-------|--------|----------|--------|
| #24 | feat(users): Day 2 — profile, password, GDPR delete and export endpoints | Abdisamad | Luca | Merged |
| #25 | feat(auth): Day 3 — password reset flow | Abdisamad | Noe | Merged |
| #26 | feat(resources+booking): Day 4 — saved resources, category filter, booking cancellation | Abdisamad | Ahmed | Merged |
| #27 | feat: Day 5 — security hardening | Luca | Abdisamad | Merged |
| #28 | feat: Day 6 — Admin API | Abdisamad | Luca | Merged |
| #29 | feat: Day 8 — AppShell, design tokens, shared components | Ahmed | Noe | Merged |
| #30 | feat: Day 9 — Profile page | Ahmed | Luca | Merged |
| #31 | feat: Day 10 — Mood history page + recharts chart | Ahmed | Abdisamad | Merged |
| #32 | fix: profile page delete account and member date | Ahmed | Luca | Merged |

Branches followed the `feature/<short-slug>` convention agreed in Sprint 1; merged branches were deleted automatically by GitHub.

---

## 5. Daily Scrum Notes

Stand-ups were captured in the team chat at the start of each work session. Three representative stand-ups are reproduced below.

### Stand-up 1 — Sprint 2 kickoff

| | |
|---|---|
| **Noe** | Yesterday: Sprint 1 retro complete, drafted the Sprint 2 backlog. Today: Migration 005 for `password_resets` table; review PR #24. Blocker: None. |
| **Luca** | Yesterday: Mapped Phase-4 evidence requirements to the security stories. Today: Writing `passwordReset.feature.test.js` ahead of Abdisamad's controller — TDD. Blocker: None. |
| **Ahmed** | Yesterday: Reviewed shared component candidates from Sprint 1 pages. Today: Sketching the design-tokens approach; starting `AppShell` skeleton. Blocker: Waiting on Profile-page wireframe sign-off. |
| **Abdisamad** | Yesterday: Closed PR #24 (profile + password + delete + export). Today: Building reset-token issue + verify endpoints. Blocker: None. |

### Stand-up 2 — Mid-sprint

| | |
|---|---|
| **Noe** | Yesterday: Reviewed PR #27 (helmet, rate limit, body cap). Today: Migration 008 for `users.role` ENUM and `requireAdmin` middleware. Blocker: None. |
| **Luca** | Yesterday: Added 14 security regression tests in `security.test.js`. Today: Writing tests for the admin endpoints ahead of PR #28. Blocker: None. |
| **Ahmed** | Yesterday: `AppShell` rolled out across all pages — every screen now has the same chrome. Today: Profile page UI + delete-confirm modal. Blocker: None. |
| **Abdisamad** | Yesterday: Password reset flow merged. Today: Admin controller — list users, soft delete, list bookings, confirm/decline. Blocker: None. |

### Stand-up 3 — Sprint close

| | |
|---|---|
| **Noe** | Yesterday: All Day-10 stories merged. Today: Generating burndown evidence for the retro. Blocker: None. |
| **Luca** | Yesterday: PRs #30–#32 reviewed and merged. Today: Verifying the full test suite stays green on `main`; preparing the Sprint 3 plan around accessibility, tests, and security docs. Blocker: None. |
| **Ahmed** | Yesterday: Mood history chart shipped (recharts, weekly aggregation). Today: Profile bug-fix PR #32. Blocker: None. |
| **Abdisamad** | Yesterday: Admin endpoints merged. Today: Code review on Ahmed's mood-history page and on the Profile delete fix. Blocker: None. |

---

## 6. Definition of Done

A story was considered Done when:

1. All acceptance criteria from the Week-4 backlog (or new ACs documented on the issue) were met.
2. Server-side endpoints had Jest + supertest coverage; client UI had at least manual smoke-test evidence in the PR description.
3. ESLint and Prettier passed (`npm run lint`, `npm run format:check`).
4. Both `code-quality.yml` and `docker-test.yml` were green on the PR.
5. A teammate other than the author reviewed and approved the PR.
6. The PR was squash-merged into `main` and the feature branch was deleted.

No story closed Sprint 2 with outstanding lint, formatting, or CI failures.

---

## 7. Sprint Review Summary

All 41 committed story points were delivered. The application now has full account-control, GDPR Right-to-Access and Right-to-Erasure, a password-recovery flow, hardened HTTP defaults, and a working admin API. The Mood History page surfaces individual trend data using `recharts`, fulfilling the "data visualisation" learning outcome from the Week-4 backlog.

The shared design system (`AppShell`, `Card`, `Button`, `ErrorBanner`, `LoadingSpinner`, `EmptyState`) was the largest non-feature investment of the sprint and unlocked the speed of Sprint 3 by removing per-page chrome work.

**Velocity:** 41 story points (Sprint 1: 23; Sprint 2: 41 — an 80% increase reflecting the team's now-stable build pipeline and fewer infrastructure unknowns).

---

## 8. Sprint Retrospective

### What went well
- **TDD on the password-reset flow** (Luca wrote the supertest cases before Abdisamad wrote the controller) caught two off-by-one errors on token expiry before merge.
- **Migration runner discipline** — every schema change was an idempotent migration in `Server/src/db/migrate.js`, so re-running on a fresh volume always converges.
- **Same-day reviews** improved on Sprint 1's pace; mean time-to-review-comment was ~3 hours.
- **Branching-policy compliance** — zero direct commits to `main` across all nine PRs.

### What did not go well
- **Admin UI was deferred** to Sprint 3 — the API was complete but no admin React page was built in Sprint 2, leaving the role visibly under-evidenced until Day 12.
- **Therapist role** was not in the original Sprint 2 plan; it was added mid-sprint via PR #34 and absorbed scope from the design-system work.
- **Soft-delete on users** initially broke the login flow (deleted users could still authenticate); the bug was caught in Luca's review of PR #24 and patched within the same day.

### Action items for Sprint 3
1. Add an explicit "UI parity" pass at the start of every sprint so admin/therapist back-ends never ship without their corresponding pages.
2. Lock the sprint scope at planning — late additions go to the backlog unless they unblock a Must-Have story.
3. Increase end-to-end coverage: Sprint 2 ended with no integration test exercising a full multi-endpoint user journey; Sprint 3 will add one.

### Carried to Sprint 3
- Admin dashboard React page (Day 12)
- Therapist availability calendar (Day 11 / PR #34)
- Accessibility audit + responsive pass (Day 13)
- Vitest client-side test suite (Day 14)
- Non-functional requirements + STRIDE threat model (Day 15)
- Integration + attack-vector security tests (Day 17)
- Production deployment guide + runbook (Day 18)
