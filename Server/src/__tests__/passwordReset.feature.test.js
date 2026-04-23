/**
 * Functional Test Suite — Password Reset Flow
 *
 * Covers:
 *   POST /api/auth/forgot-password  — request reset token
 *   POST /api/auth/reset-password   — consume token, set new password
 *
 * Security cases tested:
 *   - Unknown email returns 200 (no enumeration)
 *   - Expired token rejected
 *   - Already-used token rejected
 *   - Invalid token rejected
 *   - Weak new password rejected
 */

jest.mock('../db/connection');
jest.mock('bcrypt');

const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const bcrypt = require('bcrypt');

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.REFRESH_SECRET = 'test-refresh-secret';
});

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  test('✓ returns 200 and generic message for a registered email', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }]]) // user found
      .mockResolvedValueOnce([{ affectedRows: 0 }]) // invalidate old tokens
      .mockResolvedValueOnce([{ insertId: 1 }]); // insert new token

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'student@cardiffmet.ac.uk' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  test('✓ returns 200 for an unknown email — no enumeration', async () => {
    db.query.mockResolvedValueOnce([[]]); // user not found

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@cardiffmet.ac.uk' });

    // Must still return 200 — attacker cannot tell if email exists
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  test('✗ returns 400 when email field is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email is required/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  test('✓ resets password with a valid unexpired token', async () => {
    const token = 'validtoken123';
    const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 min ahead

    db.query.mockResolvedValueOnce([
      [{ id: 1, user_id: 1, expires_at: futureDate, used_at: null }],
    ]);
    bcrypt.hash.mockResolvedValue('new-hashed-password');
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE users
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // mark used

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewSecurePass1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  test('✗ rejects an invalid (unknown) token', async () => {
    db.query.mockResolvedValueOnce([[]]); // token hash not found

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'made-up-token', newPassword: 'NewSecurePass1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  test('✗ rejects an expired token', async () => {
    const token = 'expiredtoken';
    const pastDate = new Date(Date.now() - 60 * 1000); // 1 min in the past

    db.query.mockResolvedValueOnce([[{ id: 1, user_id: 1, expires_at: pastDate, used_at: null }]]);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewSecurePass1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  test('✗ rejects a token that has already been used', async () => {
    const token = 'usedtoken';
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);

    db.query.mockResolvedValueOnce([
      [{ id: 1, user_id: 1, expires_at: futureDate, used_at: new Date() }],
    ]);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewSecurePass1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already been used/i);
  });

  test('✗ rejects a new password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'sometoken', newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  test('✗ returns 400 when token or newPassword is missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });
});
