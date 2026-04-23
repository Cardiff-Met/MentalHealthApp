# Workshop Week 9: Functional Testing and Automation

## Assessment Point 4 — Testing, Software Security and Deployment Phase (30%)

---

## 1. Overview

This week we scaled testing from isolated unit tests to a **complete feature pathway** — testing the application the way a real user would experience it. The chosen pathway is the primary user journey:

> **Register → Login → Log Mood → Receive Personalised Resources**

Tests use **Jest** (already configured) and **supertest** (added this week) to send real HTTP requests through the Express app without binding a network port. The database and bcrypt are mocked so tests run in any environment without a live MySQL instance.

**Test file:** `Server/src/__tests__/mood.feature.test.js`  
**Test framework:** Jest + supertest  
**Total tests this suite:** 17  
**All tests:** 50 passing across 4 suites

---

## 2. Feature Pathway Tested

The pathway mirrors the Week 3 Scenario 1 (Emily — mood logging under pressure):

```
POST /api/auth/register   →  create account
POST /api/auth/login      →  receive JWT access token
POST /api/mood            →  log mood (with token)
                          ←  personalised resources returned
GET  /api/resources       →  browse resources (with token)
```

Each step is tested individually and as part of the chain.

---

## 3. Test Suite Structure

### 3.1 Registration tests (4 tests)

| Test | Input | Expected |
|------|-------|----------|
| ✓ Register new user | Valid email + password ≥ 8 chars | 201 + `accessToken` |
| ✗ Invalid email format | `not-an-email` | 400 "Invalid email format" |
| ✗ Password too short | 5-character password | 400 "8 characters" |
| ✗ Duplicate email | Email already in DB | 409 "already exists" |

### 3.2 Login tests (3 tests)

| Test | Input | Expected |
|------|-------|----------|
| ✓ Correct credentials | Matching email + password | 200 + `accessToken` |
| ✗ Wrong password | Correct email, wrong password | 401 generic message |
| ✗ Unknown email | Email not in DB | 401 generic message |

> The error message is identical for both wrong-password and unknown-email cases (`"Invalid email or password."`) — this is intentional and prevents user enumeration attacks.

### 3.3 Mood logging tests (7 tests)

| Test | Input | Expected |
|------|-------|----------|
| ✓ Valid mood log | Rating 3, valid token | 201 + resources array + `isCrisis: false` |
| ✓ Crisis trigger | Rating 1, valid token | 201 + `isCrisis: true` |
| ✗ No auth token | No Authorization header | 401 "No token provided" |
| ✗ Invalid token | Malformed JWT string | 403 |
| ✗ Rating below minimum | `rating: 0` | 400 "between 1 and 5" |
| ✗ Rating above maximum | `rating: 6` | 400 "between 1 and 5" |
| ✗ Missing rating | Empty body `{}` | 400 |

### 3.4 Resources tests (2 tests)

| Test | Input | Expected |
|------|-------|----------|
| ✓ Authenticated request | Valid token | 200 + resources array |
| ✗ No auth token | No Authorization header | 401 |

### 3.5 Health check (1 test)

| Test | Expected |
|------|----------|
| ✓ GET /health | 200 `{ status: 'ok' }` |

---

## 4. Test Output — All Passing

```
PASS src/__tests__/mood.feature.test.js
  Feature: User Registration (POST /api/auth/register)
    ✓ registers a new user and returns an access token
    ✓ rejects registration with an invalid email format
    ✓ rejects registration with a password shorter than 8 characters
    ✓ rejects duplicate email with 409 Conflict
  Feature: User Login (POST /api/auth/login)
    ✓ logs in with correct credentials and returns an access token
    ✓ rejects login with a wrong password
    ✓ rejects login for an unregistered email
  Feature: Mood Logging (POST /api/mood)
    ✓ logs a valid mood and returns personalised resources
    ✓ triggers crisis flag when mood rating is 1
    ✓ rejects mood log with no auth token — returns 401
    ✓ rejects mood log with an invalid token — returns 403
    ✓ rejects mood rating of 0 (below minimum) — returns 400
    ✓ rejects mood rating of 6 (above maximum) — returns 400
    ✓ rejects missing mood rating — returns 400
  Feature: Resources (GET /api/resources)
    ✓ returns resources for an authenticated user
    ✓ returns 401 when accessing resources without auth
  Infrastructure: Health check (GET /health)
    ✓ returns status ok

Tests: 17 passed, 17 total
Time:  2.567 s
```

**Full suite (all test files):**

```
Test Suites: 4 passed, 4 total
Tests:       50 passed, 50 total
Time:        3.341 s
```

---

## 5. Technical Approach

### Why supertest?

supertest binds the Express app to a random port per test run — no port conflicts, no live server needed. It makes real HTTP requests through the full Express middleware stack (auth, validation, routing, controller), giving genuine end-to-end coverage at the API level.

### Why mock the database?

The workshop requirement is reproducible tests that "produce the same result each time they run." A live MySQL database would:
- Require Docker to be running
- Leave test data in the DB between runs
- Fail if the DB is unavailable

Mocking `db.query` with `jest.mock('../db/connection')` isolates the tests completely.

### Why mock bcrypt?

bcrypt's intentional slowness (10 salt rounds ≈ 100–200ms per call) would make the suite unnecessarily slow. Mocking it keeps each test under 10ms while still verifying that the controller calls the right bcrypt functions.

### app.js extraction

`src/index.js` previously combined app setup and `app.listen()`. This sprint split them:
- `src/app.js` — creates and exports the Express app (no `listen` call)
- `src/index.js` — imports app and calls `app.listen(PORT)` for production

This is a standard Node.js pattern that allows test files to `require('./app')` without binding a real port.

---

## 6. Docker Integration

The test suite runs inside the Docker environment using the same commands documented in the README:

```bash
# Build the server image
docker compose build server

# Run tests inside the container
docker compose run --rm server npm test
```

Expected output:
```
Test Suites: 4 passed, 4 total
Tests:       50 passed, 50 total
```

---

## 7. Evidence Checklist

| Evidence | Status |
|----------|--------|
| Functional test file exists (`mood.feature.test.js`) | ✅ |
| Tests cover complete feature pathway (register → login → mood → resources) | ✅ |
| Tests cover normal success flow | ✅ |
| Tests cover at least one failure / edge case per endpoint | ✅ |
| Crisis flag tested (mood rating = 1 → `isCrisis: true`) | ✅ |
| All 17 new tests passing | ✅ |
| All 50 total tests passing | ✅ |
| Tests run with `npm test` (one command) | ✅ |
| Docker build + test run documented in README | ✅ |
| GitHub Actions `docker-test.yml` runs tests on push | ✅ |
