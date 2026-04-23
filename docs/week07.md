# Workshop Week 7: Security Checks and Privacy

## Assessment Point 4 — Testing, Software Security and Deployment Phase (30%)

---

## 1. Authentication and Authorisation

### Roles

The system implements two distinct user roles:

| Role    | Description                                      |
|---------|--------------------------------------------------|
| `user`  | Standard student account. Can log moods, browse resources, and book therapy sessions. |
| `admin` | Administrator account. Can access protected admin endpoints such as viewing all registered users. |

The `role` field is stored in the `users` table as an `ENUM('user', 'admin')` with a default of `'user'`. The role is embedded in the JWT access token payload at login so every request carries it without an additional database lookup.

```sql
-- users table schema (Server/src/db/schema.sql)
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Authentication Flow

1. User submits email and password to `POST /api/auth/login`.
2. Server verifies the password against the stored bcrypt hash.
3. On success, a short-lived **JWT access token** (15 minutes) is returned in the response body.
4. A long-lived **refresh token** (7 days) is set as an `httpOnly` cookie — inaccessible to JavaScript.
5. The client stores the access token in `localStorage` and includes it as `Authorization: Bearer <token>` on every subsequent request.

```js
// Server/src/middleware/auth.js
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // { userId, email, role }
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}
```

### Authorisation: Role-Based Access Control

A separate `requireAdmin` middleware guards admin-only endpoints. It runs **after** `authenticateToken` and checks the `role` field on `req.user`:

```js
// Server/src/middleware/requireAdmin.js
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}
```

**Protected admin endpoint:**

```
GET /api/admin/users
```

This endpoint returns a list of all registered users. It requires both `authenticateToken` and `requireAdmin`:

```js
router.get('/users', authenticateToken, requireAdmin, async (req, res) => { ... });
```

**What happens when an unauthorised user tries to access it:**

- If no token is provided → `401 Access denied. No token provided.`
- If token is valid but role is `user` → `403 Forbidden. Admin access required.`
- Only a token with `role: 'admin'` proceeds to the handler.

---

## 2. Input Validation

User input is validated at two points before reaching the database.

### Validation 1 — Email format (Registration endpoint)

**Location:** `Server/src/utils/validation.js` → `isValidEmail()`

```js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}
```

| Input | Result | Reason |
|-------|--------|--------|
| `student@cardiffmet.ac.uk` | ✅ Accepted | Valid format |
| `studentcardiffmet.ac.uk` | ❌ Rejected | Missing `@` symbol |
| `student@` | ❌ Rejected | No domain after `@` |
| `stu dent@cardiff.ac.uk` | ❌ Rejected | Contains space |
| `null` | ❌ Rejected | No value provided |

### Validation 2 — Password length (Registration endpoint)

**Location:** `Server/src/utils/validation.js` → `isValidPassword()`

```js
function isValidPassword(password) {
  if (!password) return false;
  return password.length >= 8;
}
```

| Input | Result | Reason |
|-------|--------|--------|
| `securepass` | ✅ Accepted | 10 characters, meets minimum |
| `short` | ❌ Rejected | Only 5 characters |
| `1234567` | ❌ Rejected | Only 7 characters, one below minimum |
| `null` | ❌ Rejected | No value provided |

### Validation 3 — Mood rating range (Mood log endpoint)

**Location:** `Server/src/utils/validation.js` → `isValidMoodRating()`

```js
function isValidMoodRating(rating) {
  if (typeof rating !== 'number') return false;
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
```

| Input | Result | Reason |
|-------|--------|--------|
| `3` | ✅ Accepted | Integer within 1–5 |
| `0` | ❌ Rejected | Below minimum |
| `6` | ❌ Rejected | Above maximum |
| `2.5` | ❌ Rejected | Decimal, not integer |
| `"three"` | ❌ Rejected | String input, not a number |

---

## 3. Password Security

Passwords are **never stored in plain text**. The application uses **bcrypt** with a salt factor of 10.

```js
// Server/src/controllers/authController.js
const SALT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
```

On login, the entered password is compared to the stored hash using `bcrypt.compare()`. The plaintext password is never stored or logged.

**What we do NOT do:**
- Store plain text passwords
- Use general hashing algorithms (MD5, SHA-1, plain SHA-256)
- Encrypt passwords (hashing is one-way, encryption is reversible)

---

## 4. Privacy Audit — GDPR Checklist

| Principle | Status | Implementation |
|-----------|--------|----------------|
| **Consent** | ✅ | Users register voluntarily. The login page states that data is handled securely and in line with GDPR. |
| **Purpose limitation** | ✅ | Only email and password are collected at registration. Mood logs and bookings are created only by the user's own actions. |
| **Data minimisation** | ✅ | No names, phone numbers, or unnecessary personal data are collected. Email is required only for account identification. |
| **Secure storage** | ✅ | Passwords are bcrypt-hashed. JWT secrets are stored in environment variables, not in code. Database is not publicly exposed. |
| **Access control** | ✅ | All data endpoints require a valid JWT. Users can only read and write their own mood logs and bookings. Admin role required for user listing. |
| **Data visibility** | ⚠️ | Users can currently view their mood history and bookings. A "delete my account" feature has not yet been implemented. |
| **Breach readiness** | ⚠️ | No formal incident response process documented. Recommended for future sprint. |

### Planned Improvements

1. Add a **"Delete my account"** endpoint that removes the user and all associated data (mood logs, bookings) via the existing `ON DELETE CASCADE` foreign key constraints already in the schema.
2. Add a **privacy policy page** to the client describing what data is collected and how it is used.
3. Enable `secure: true` on the refresh token cookie when deploying over HTTPS.

---

## Summary

| Security Measure | Implementation |
|------------------|----------------|
| Authentication | JWT access tokens (15 min) + httpOnly refresh token cookie (7 days) |
| Authorisation | Role-based — `user` and `admin` roles enforced via middleware |
| Password storage | bcrypt with 10 salt rounds (no plain text ever stored) |
| Input validation | Email regex, password length, mood rating range — all validated before DB |
| Transport security | CORS restricted to known client origin; `secure` cookie flag for HTTPS (planned) |
| SQL injection prevention | Parameterised queries used throughout (`db.query('...?', [value])`) |
