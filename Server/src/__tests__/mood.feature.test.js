/**
 * Functional Test Suite — Mood Logging Feature Pathway
 *
 * This suite tests the complete user-facing feature pathway:
 *   Register → Login → Log Mood → Receive personalised resources
 *
 * All database calls are mocked so the suite runs without a live MySQL instance.
 * Tests use supertest to send real HTTP requests through the Express app.
 *
 * Coverage:
 *   - Normal successful flow (happy path)
 *   - Edge case: unauthenticated mood log attempt
 *   - Edge case: invalid mood rating (out of range)
 *   - Edge case: missing mood rating
 *   - Edge case: crisis trigger (rating = 1)
 *   - Edge case: duplicate registration
 *   - Edge case: login with wrong password
 */

// ── Mock the database so no live MySQL is needed ──────────────────────────────
jest.mock('../db/connection');

// ── Mock bcrypt to keep tests fast (no real hashing) ─────────────────────────
jest.mock('bcrypt');

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const bcrypt = require('bcrypt');

// ── Override JWT secrets after dotenv has run (app.js calls dotenv on load) ──
// auth.js reads process.env.JWT_SECRET at call-time, so this takes effect.
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.REFRESH_SECRET = 'test-refresh-secret';
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a valid JWT access token for a test user */
function makeToken(overrides = {}) {
  return jwt.sign(
    { userId: 1, email: 'student@cardiffmet.ac.uk', role: 'user', ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/** Sample resources returned by the mocked DB for a mid-range mood */
const SAMPLE_RESOURCES = [
  { id: 1, title: 'Breathing exercises', min_mood: 2, max_mood: 4 },
  { id: 2, title: 'Study stress tips', min_mood: 2, max_mood: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature pathway: Registration
// ─────────────────────────────────────────────────────────────────────────────

describe('Feature: User Registration (POST /api/auth/register)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('✓ registers a new user and returns an access token', async () => {
    db.query
      .mockResolvedValueOnce([[]])                          // no existing user
      .mockResolvedValueOnce([{ insertId: 1 }]);            // INSERT result
    bcrypt.hash.mockResolvedValue('hashed-password');

    const res = await request(app).post('/api/auth/register').send({
      email: 'student@cardiffmet.ac.uk',
      password: 'securepass',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.message).toBe('Account created successfully.');
  });

  test('✗ rejects registration with an invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'securepass',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  test('✗ rejects registration with a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'student@cardiffmet.ac.uk',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  test('✗ rejects duplicate email with 409 Conflict', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]); // existing user found

    const res = await request(app).post('/api/auth/register').send({
      email: 'student@cardiffmet.ac.uk',
      password: 'securepass',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature pathway: Login
// ─────────────────────────────────────────────────────────────────────────────

describe('Feature: User Login (POST /api/auth/login)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('✓ logs in with correct credentials and returns an access token', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, email: 'student@cardiffmet.ac.uk', password: 'hashed-password', role: 'user' },
    ]]);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app).post('/api/auth/login').send({
      email: 'student@cardiffmet.ac.uk',
      password: 'securepass',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.message).toBe('Login successful.');
  });

  test('✗ rejects login with a wrong password', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, email: 'student@cardiffmet.ac.uk', password: 'hashed-password', role: 'user' },
    ]]);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app).post('/api/auth/login').send({
      email: 'student@cardiffmet.ac.uk',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    // Generic message — must NOT reveal which field is wrong
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('✗ rejects login for an unregistered email', async () => {
    db.query.mockResolvedValueOnce([[]]); // no user found

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@cardiffmet.ac.uk',
      password: 'securepass',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature pathway: Mood Logging + Resource Recommendations
// ─────────────────────────────────────────────────────────────────────────────

describe('Feature: Mood Logging (POST /api/mood)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('✓ logs a valid mood and returns personalised resources', async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // INSERT mood_log
      .mockResolvedValueOnce([SAMPLE_RESOURCES]);      // SELECT resources

    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 3, description: 'Feeling okay today' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Mood logged successfully.');
    expect(res.body.isCrisis).toBe(false);
    expect(Array.isArray(res.body.resources)).toBe(true);
  });

  test('✓ triggers crisis flag when mood rating is 1', async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 3, title: 'Samaritans — 116 123', min_mood: 1, max_mood: 1 }]]);

    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 1 });

    expect(res.status).toBe(201);
    expect(res.body.isCrisis).toBe(true);  // crisis panel must be triggered
  });

  test('✗ rejects mood log with no auth token — returns 401', async () => {
    const res = await request(app).post('/api/mood').send({ rating: 3 });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token/i);
  });

  test('✗ rejects mood log with an invalid token — returns 403', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', 'Bearer this.is.not.valid')
      .send({ rating: 3 });

    expect(res.status).toBe(403);
  });

  test('✗ rejects mood rating of 0 (below minimum) — returns 400', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/1 and 5/i);
  });

  test('✗ rejects mood rating of 6 (above maximum) — returns 400', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 6 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/1 and 5/i);
  });

  test('✗ rejects missing mood rating — returns 400', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature pathway: Resources
// ─────────────────────────────────────────────────────────────────────────────

describe('Feature: Resources (GET /api/resources)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('✓ returns resources for an authenticated user', async () => {
    db.query.mockResolvedValueOnce([SAMPLE_RESOURCES]);

    const res = await request(app)
      .get('/api/resources')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
  });

  test('✗ returns 401 when accessing resources without auth', async () => {
    const res = await request(app).get('/api/resources');

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Infrastructure: Health check
// ─────────────────────────────────────────────────────────────────────────────

describe('Infrastructure: Health check (GET /health)', () => {
  test('✓ returns status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
