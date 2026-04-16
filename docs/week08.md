# Workshop Week 8: Test-First Development and Reliable Coding

## Assessment Point 4 — Testing, Software Security and Deployment Phase (30%)

---

## Overview

This week we applied **Test-Driven Development (TDD)** to extract and verify the input validation logic embedded in our controllers. The chosen function target was `src/utils/validation.js` — a pure utility module with no database or network dependencies, making it ideal for isolated unit testing.

**Testing framework:** Jest (Node.js)
**Test file:** `Server/src/__tests__/validation.test.js`
**Implementation file:** `Server/src/utils/validation.js`

---

## Step 1: Write Tests First (Before Implementation)

The test file was written **before** any implementation existed. The `validation.js` module was created with empty function bodies so the test file could import it without errors, but all functions returned `undefined`.

**Initial `validation.js` (empty — no implementation):**

```js
function isValidEmail(email) {}
function isValidPassword(password) {}
function isValidMoodRating(rating) {}

module.exports = { isValidEmail, isValidPassword, isValidMoodRating };
```

**Test file written first (`validation.test.js`):**

```js
const { isValidEmail, isValidPassword, isValidMoodRating } = require('../utils/validation');

describe('isValidEmail', () => {
  test('accepts a valid email address', () => {
    expect(isValidEmail('student@cardiffmet.ac.uk')).toBe(true);
  });
  test('rejects an email missing the @ symbol', () => {
    expect(isValidEmail('studentcardiffmet.ac.uk')).toBe(false);
  });
  test('rejects null input', () => {
    expect(isValidEmail(null)).toBe(false);
  });
  // ... (7 tests total for isValidEmail)
});

describe('isValidPassword', () => {
  test('accepts a password of exactly 8 characters', () => {
    expect(isValidPassword('password')).toBe(true);
  });
  test('rejects a password shorter than 8 characters', () => {
    expect(isValidPassword('short')).toBe(false);
  });
  // ... (6 tests total for isValidPassword)
});

describe('isValidMoodRating', () => {
  test('accepts rating of 1 (minimum)', () => {
    expect(isValidMoodRating(1)).toBe(true);
  });
  test('rejects rating of 6 (above maximum)', () => {
    expect(isValidMoodRating(6)).toBe(false);
  });
  test('rejects a decimal number', () => {
    expect(isValidMoodRating(2.5)).toBe(false);
  });
  // ... (8 tests total for isValidMoodRating)
});
```

---

## Step 2: Run Tests — All Failing (Expected)

Running `npm test` before implementing any logic produced 21 failures. All functions returned `undefined` instead of the expected boolean values:

```
FAIL src/__tests__/validation.test.js
  ● isValidEmail › accepts a valid email address
    Expected: true
    Received: undefined

  ● isValidPassword › accepts a password of exactly 8 characters
    Expected: true
    Received: undefined

  ● isValidMoodRating › accepts rating of 1 (minimum)
    Expected: true
    Received: undefined

  ...

Tests:       21 failed, 21 total
```

This confirmed that the tests are testing real behaviour, not implementation — exactly as TDD requires.

---

## Step 3: Implement the Functions

The three functions were implemented in `validation.js`:

```js
// Server/src/utils/validation.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}

function isValidPassword(password) {
  if (!password) return false;
  return password.length >= 8;
}

function isValidMoodRating(rating) {
  if (typeof rating !== 'number') return false;
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

module.exports = { isValidEmail, isValidPassword, isValidMoodRating };
```

---

## Step 4: Run Tests — All Passing

```
PASS src/__tests__/validation.test.js
  isValidEmail
    ✓ accepts a valid email address
    ✓ accepts a standard email address
    ✓ rejects an email missing the @ symbol
    ✓ rejects an email with no domain after @
    ✓ rejects an empty string
    ✓ rejects null input
    ✓ rejects an email with spaces
  isValidPassword
    ✓ accepts a password of exactly 8 characters
    ✓ accepts a password longer than 8 characters
    ✓ rejects a password shorter than 8 characters
    ✓ rejects an empty string
    ✓ rejects null input
    ✓ rejects a password of 7 characters
  isValidMoodRating
    ✓ accepts rating of 1 (minimum)
    ✓ accepts rating of 5 (maximum)
    ✓ accepts rating of 3 (middle)
    ✓ rejects rating of 0 (below minimum)
    ✓ rejects rating of 6 (above maximum)
    ✓ rejects a string input
    ✓ rejects a decimal number
    ✓ rejects null input

Tests:       21 passed, 21 total
Time:        0.984 s
```

---

## Step 5: Refactoring

After the tests passed, we refactored to improve code quality without changing behaviour.

**Before refactoring (inside `authController.js`):**

```js
// Inline regex defined inside the register function
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format.' });
}

if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters.' });
}
```

**After refactoring (using the extracted utility):**

```js
// authController.js now imports the validated, tested utility
const { isValidEmail, isValidPassword } = require('../utils/validation');

if (!isValidEmail(email)) {
  return res.status(400).json({ error: 'Invalid email format.' });
}

if (!isValidPassword(password)) {
  return res.status(400).json({ error: 'Password must be at least 8 characters.' });
}
```

**Improvements made:**

| Issue | Before | After |
|-------|--------|-------|
| Duplicated logic | Email regex repeated wherever email was validated | Single reusable function in `validation.js` |
| Untestable code | Validation logic tightly coupled to Express request handler | Pure functions with no dependencies — trivially testable |
| Regex scope | Regex compiled on every function call inside `register()` | Compiled once as a module-level constant (`EMAIL_REGEX`) |
| Unclear intent | `emailRegex.test(email)` — requires reading the regex to understand | `isValidEmail(email)` — intent clear from the name |

Tests were re-run after refactoring to confirm behaviour was unchanged:

```
Tests:       21 passed, 21 total
```

---

## Step 6: Integration via Pull Request

The test suite, implementation, and refactored controller were committed on a feature branch and merged into `main` via a Pull Request:

- **Branch:** `feature/unit-tests-validation`
- **Files changed:** `validation.js`, `validation.test.js`, `authController.js`, `package.json`
- **PR reviewed by:** at least one team member before merge
- **CI check:** GitHub Actions linting workflow passes on merge

---

## Test Coverage Summary

| Function | Tests | Valid inputs tested | Invalid/edge inputs tested |
|----------|-------|---------------------|---------------------------|
| `isValidEmail` | 7 | 2 | 5 (missing @, no domain, empty, null, spaces) |
| `isValidPassword` | 6 | 2 | 4 (too short, 7 chars, empty, null) |
| `isValidMoodRating` | 8 | 3 | 5 (0, 6, string, decimal, null) |
| **Total** | **21** | **7** | **14** |
