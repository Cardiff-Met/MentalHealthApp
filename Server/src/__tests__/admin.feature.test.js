/**
 * Functional Test Suite — Admin API
 *
 * Covers:
 *   GET    /api/admin/users          — list all users
 *   GET    /api/admin/resources      — list all resources
 *   POST   /api/admin/resources      — create resource
 *   PATCH  /api/admin/resources/:id  — update resource
 *   DELETE /api/admin/resources/:id  — delete resource
 *   GET    /api/admin/bookings       — list all bookings
 *   PATCH  /api/admin/bookings/:id   — confirm / decline booking
 *
 * All endpoints require admin role — 403 tests for regular users are included.
 */

jest.mock('../db/connection');

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

beforeAll(() => {
  process.env.JWT_SECRET = 'ci-jwt-secret-value-that-is-long-enough-here';
  process.env.REFRESH_SECRET = 'ci-refresh-secret-value-that-is-long-enough';
  process.env.NODE_ENV = 'test';
});

beforeEach(() => jest.clearAllMocks());

function makeToken(overrides = {}) {
  return jwt.sign(
    { userId: 1, email: 'admin@cardiffmet.ac.uk', role: 'admin', ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

const adminToken = () => makeToken({ role: 'admin' });
const userToken = () => makeToken({ role: 'user' });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  test('✓ returns all users for admin', async () => {
    db.query.mockResolvedValueOnce([
      [
        { id: 1, email: 'admin@cardiffmet.ac.uk', role: 'admin', created_at: new Date() },
        { id: 2, email: 'student@cardiffmet.ac.uk', role: 'user', created_at: new Date() },
      ],
    ]);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users).toHaveLength(2);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
  });

  test('✗ returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/resources
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/resources', () => {
  test('✓ returns all resources for admin', async () => {
    db.query.mockResolvedValueOnce([
      [
        { id: 1, title: 'Breathing exercises', category: 'anxiety' },
        { id: 2, title: 'Crisis line', category: 'crisis' },
      ],
    ]);

    const res = await request(app)
      .get('/api/admin/resources')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/resources')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/resources
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/resources', () => {
  test('✓ creates a resource and returns 201', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 10 }]);

    const res = await request(app)
      .post('/api/admin/resources')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'New Resource', url: 'https://example.com', category: 'general' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Resource created.');
    expect(res.body.resourceId).toBe(10);
  });

  test('✗ returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/admin/resources')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Missing url and category' });

    expect(res.status).toBe(400);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .post('/api/admin/resources')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: 'Test', url: 'https://example.com', category: 'general' });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/resources/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/resources/:id', () => {
  test('✓ updates a resource', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }]]) // resource exists
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

    const res = await request(app)
      .patch('/api/admin/resources/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Resource updated.');
  });

  test('✗ returns 404 for non-existent resource', async () => {
    db.query.mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .patch('/api/admin/resources/999')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .patch('/api/admin/resources/1')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/resources/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/admin/resources/:id', () => {
  test('✓ deletes a resource', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }]]) // resource exists
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE

    const res = await request(app)
      .delete('/api/admin/resources/1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Resource deleted.');
  });

  test('✗ returns 404 for non-existent resource', async () => {
    db.query.mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .delete('/api/admin/resources/999')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .delete('/api/admin/resources/1')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/bookings
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/bookings', () => {
  test('✓ returns all bookings with user and slot details', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          status: 'pending',
          user_email: 'student@cardiffmet.ac.uk',
          slot_date: '2025-06-01',
          slot_time: '10:00:00',
          time_of_day: 'morning',
          created_at: new Date(),
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/bookings/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/bookings/:id', () => {
  test('✓ confirms a pending booking and marks slot as booked', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1, status: 'pending', slot_id: 5 }]]) // booking found
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE bookings
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE therapy_slots

    const res = await request(app)
      .patch('/api/admin/bookings/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Booking confirmed.');
  });

  test('✓ declines a pending booking and restores slot', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1, status: 'pending', slot_id: 5 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .patch('/api/admin/bookings/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'declined' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Booking declined.');
  });

  test('✗ returns 400 for invalid status value', async () => {
    const res = await request(app)
      .patch('/api/admin/bookings/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/confirmed.*declined|declined.*confirmed/i);
  });

  test('✗ returns 404 when booking not found', async () => {
    db.query.mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .patch('/api/admin/bookings/999')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
  });

  test('✗ returns 409 when booking is already confirmed', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'confirmed', slot_id: 5 }]]);

    const res = await request(app)
      .patch('/api/admin/bookings/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(409);
  });

  test('✗ returns 403 for non-admin user', async () => {
    const res = await request(app)
      .patch('/api/admin/bookings/1')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});
