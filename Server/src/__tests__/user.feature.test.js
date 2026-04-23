/**
 * Functional Test Suite — User Account Feature Pathway
 *
 * Covers:
 *   GET    /api/users/me          — get profile
 *   PATCH  /api/users/me          — update email
 *   PATCH  /api/users/me/password — change password
 *   DELETE /api/users/me          — soft-delete account (GDPR erasure)
 *   GET    /api/users/me/export   — data export (GDPR portability)
 */

jest.mock('../db/connection');
jest.mock('bcrypt');

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const bcrypt = require('bcrypt');

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.REFRESH_SECRET = 'test-refresh-secret';
});

beforeEach(() => jest.clearAllMocks());

function makeToken(overrides = {}) {
  return jwt.sign(
    { userId: 1, email: 'student@cardiffmet.ac.uk', role: 'user', ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

const MOCK_USER = {
  id: 1,
  email: 'student@cardiffmet.ac.uk',
  role: 'user',
  created_at: '2026-01-01T00:00:00.000Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/me
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  test('✓ returns profile for authenticated user', async () => {
    db.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('student@cardiffmet.ac.uk');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('✗ returns 401 with no token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  test('✗ returns 404 when user has been soft-deleted', async () => {
    db.query.mockResolvedValueOnce([[]]); // deleted_at filter returns nothing

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/me
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/users/me', () => {
  test('✓ updates email successfully', async () => {
    db.query
      .mockResolvedValueOnce([[]]) // no conflict
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE
      .mockResolvedValueOnce([[{ ...MOCK_USER, email: 'new@cardiffmet.ac.uk' }]]); // refetch

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ email: 'new@cardiffmet.ac.uk' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated.');
    expect(res.body.user.email).toBe('new@cardiffmet.ac.uk');
  });

  test('✗ rejects invalid email format', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  test('✗ rejects duplicate email with 409', async () => {
    db.query.mockResolvedValueOnce([[{ id: 2 }]]); // another user has this email

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ email: 'taken@cardiffmet.ac.uk' });

    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/me/password
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/users/me/password', () => {
  test('✓ changes password with correct current password', async () => {
    db.query.mockResolvedValueOnce([[{ password: 'hashed-old' }]]);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('hashed-new');
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'OldPass123', newPassword: 'NewPass456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password updated successfully.');
  });

  test('✗ rejects wrong current password with 401', async () => {
    db.query.mockResolvedValueOnce([[{ password: 'hashed-old' }]]);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'WrongPass', newPassword: 'NewPass456' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrect/i);
  });

  test('✗ rejects new password shorter than 8 characters', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'OldPass123', newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/me  (GDPR Right to Erasure)
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/users/me', () => {
  test('✓ soft-deletes account after password confirmation', async () => {
    db.query.mockResolvedValueOnce([[{ password: 'hashed-pass' }]]);
    bcrypt.compare.mockResolvedValue(true);
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // soft-delete
    db.query.mockResolvedValueOnce([{ affectedRows: 3 }]); // anonymise mood logs

    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ password: 'CorrectPass123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('✗ rejects deletion with wrong password', async () => {
    db.query.mockResolvedValueOnce([[{ password: 'hashed-pass' }]]);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ password: 'WrongPass' });

    expect(res.status).toBe(401);
  });

  test('✗ returns 400 when no password provided', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/me/export  (GDPR Right to Portability)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/users/me/export', () => {
  test('✓ returns full data export for authenticated user', async () => {
    db.query
      .mockResolvedValueOnce([[MOCK_USER]]) // user profile
      .mockResolvedValueOnce([[{ id: 1, rating: 3, description: 'Okay', logged_at: '2026-01-02' }]]) // mood logs
      .mockResolvedValueOnce([[]]) // bookings (empty)
      .mockResolvedValueOnce([[]]); // saved resources (empty)

    const res = await request(app)
      .get('/api/users/me/export')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exportedAt');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('mood_logs');
    expect(res.body).toHaveProperty('bookings');
    expect(res.body).toHaveProperty('saved_resources');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('✗ returns 401 without auth token', async () => {
    const res = await request(app).get('/api/users/me/export');
    expect(res.status).toBe(401);
  });
});
