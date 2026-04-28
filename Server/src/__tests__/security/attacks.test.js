/**
 * Security Test Suite — Attack-vector regression tests
 *
 * Demonstrates that common attack vectors are rejected by the application:
 *   - SQL injection on /api/auth/login
 *   - XSS payload stored in mood description
 *   - Missing JWT
 *   - Tampered JWT (signature mismatch)
 *   - Expired JWT
 *   - Forged role claim (privilege escalation attempt)
 *   - Mass-assignment on /api/auth/register (cannot self-promote to admin)
 */

jest.mock('../../db/connection');
jest.mock('bcrypt');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const db = require('../../db/connection');
const bcrypt = require('bcrypt');

beforeAll(() => {
  process.env.JWT_SECRET = 'security-test-secret-32-chars-or-more';
  process.env.REFRESH_SECRET = 'security-test-refresh-secret-32-chars';
  process.env.NODE_ENV = 'test';
});

beforeEach(() => jest.clearAllMocks());

// ── SQL Injection ────────────────────────────────────────────────────────────

describe('SQL injection', () => {
  test("classic ' OR 1=1 -- payload on login is treated as a literal string", async () => {
    // The mocked DB returns no user — proving the parameterised query treated
    // the payload as data, not SQL.
    db.query.mockResolvedValueOnce([[]]);

    const res = await request(app).post('/api/auth/login').send({
      email: "admin@cardiffmet.ac.uk' OR '1'='1",
      password: "anything' OR '1'='1",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');

    // Verify mysql2 was called with the payload as a parameter, not concatenated
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      expect.arrayContaining(["admin@cardiffmet.ac.uk' OR '1'='1"])
    );
  });

  test('UNION-based injection on email field is rejected', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const res = await request(app).post('/api/auth/login').send({
      email: "x' UNION SELECT id, password FROM users--",
      password: 'whatever',
    });

    expect(res.status).toBe(401);
  });
});

// ── XSS ──────────────────────────────────────────────────────────────────────

describe('XSS payload handling', () => {
  test('mood description containing <script> is stored verbatim and not executed by the API', async () => {
    const xssPayload = '<script>alert("xss")</script>';

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[]]);

    const token = jwt.sign(
      { userId: 1, email: 'u@cardiffmet.ac.uk', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, description: xssPayload });

    expect(res.status).toBe(201);

    // The API persists the raw string — output safety is the client's job
    // (React auto-escapes interpolated text). Confirm the payload reached
    // the DB exactly as posted, then assert the response is JSON, never HTML.
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT'),
      expect.arrayContaining([xssPayload])
    );
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ── JWT tampering ────────────────────────────────────────────────────────────

describe('JWT validation', () => {
  test('request without an Authorization header is rejected with 401', async () => {
    const res = await request(app).get('/api/booking/my');
    expect(res.status).toBe(401);
  });

  test('request with a tampered JWT (wrong signature) is rejected', async () => {
    const valid = jwt.sign(
      { userId: 1, email: 'u@cardiffmet.ac.uk', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    // Flip the last character of the signature segment
    const parts = valid.split('.');
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === 'A' ? 'B' : 'A');
    const tampered = parts.join('.');

    const res = await request(app)
      .get('/api/booking/my')
      .set('Authorization', `Bearer ${tampered}`);

    expect(res.status).toBe(403);
  });

  test('expired JWT is rejected', async () => {
    const expired = jwt.sign(
      { userId: 1, email: 'u@cardiffmet.ac.uk', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );

    const res = await request(app).get('/api/booking/my').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(403);
  });

  test('JWT signed with a different secret is rejected', async () => {
    const foreign = jwt.sign(
      { userId: 1, email: 'attacker@evil.com', role: 'admin' },
      'totally-different-secret',
      { expiresIn: '15m' }
    );

    const res = await request(app).get('/api/booking/my').set('Authorization', `Bearer ${foreign}`);

    expect(res.status).toBe(403);
  });
});

// ── Privilege escalation ─────────────────────────────────────────────────────

describe('Privilege escalation attempts', () => {
  test('a student JWT cannot access admin-only endpoints', async () => {
    const studentToken = jwt.sign(
      { userId: 1, email: 'u@cardiffmet.ac.uk', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  test('register endpoint ignores client-supplied role field', async () => {
    db.query
      .mockResolvedValueOnce([[]]) // no existing user
      .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT
    bcrypt.hash.mockResolvedValue('hash');

    const res = await request(app).post('/api/auth/register').send({
      email: 'attacker@cardiffmet.ac.uk',
      password: 'Securepass1',
      role: 'admin', // attempt to self-promote
    });

    expect(res.status).toBe(201);

    // Verify INSERT did not include 'admin' as a parameter
    const insertCall = db.query.mock.calls.find((call) => /INSERT/.test(call[0]));
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).not.toContain('admin');
  });
});
