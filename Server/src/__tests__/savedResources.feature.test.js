/**
 * Functional Test Suite — Saved Resources + Booking Cancellation
 *
 * Covers:
 *   GET    /api/resources?category=  — category filter
 *   GET    /api/resources/saved      — list saved resources
 *   POST   /api/resources/:id/save   — save a resource
 *   DELETE /api/resources/:id/save   — unsave a resource
 *   DELETE /api/booking/:id          — cancel a booking
 */

jest.mock('../db/connection');

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

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

const MOCK_RESOURCES = [
  { id: 3, title: 'Student Minds', category: 'anxiety', min_mood: 2, max_mood: 3 },
  { id: 4, title: 'Calm', category: 'anxiety', min_mood: 2, max_mood: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resources (with category filter)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/resources', () => {
  test('✓ returns all resources when no filter applied', async () => {
    db.query.mockResolvedValueOnce([MOCK_RESOURCES]);

    const res = await request(app)
      .get('/api/resources')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
  });

  test('✓ returns filtered resources by category', async () => {
    db.query.mockResolvedValueOnce([MOCK_RESOURCES]);

    const res = await request(app)
      .get('/api/resources?category=anxiety')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
  });

  test('✗ returns 401 without auth token', async () => {
    const res = await request(app).get('/api/resources');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resources/:id/save
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/resources/:id/save', () => {
  test('✓ saves a resource successfully', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }]]) // resource exists
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT IGNORE

    const res = await request(app)
      .post('/api/resources/1/save')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Resource saved.');
  });

  test('✗ returns 404 for a non-existent resource', async () => {
    db.query.mockResolvedValueOnce([[]]); // resource not found

    const res = await request(app)
      .post('/api/resources/999/save')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  test('✗ returns 401 without auth token', async () => {
    const res = await request(app).post('/api/resources/1/save');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/resources/:id/save
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/resources/:id/save', () => {
  test('✓ removes a saved resource', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/resources/1/save')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  test('✗ returns 404 when resource was not saved', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/resources/1/save')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resources/saved
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/resources/saved', () => {
  test('✓ returns saved resources for authenticated user', async () => {
    db.query.mockResolvedValueOnce([MOCK_RESOURCES]);

    const res = await request(app)
      .get('/api/resources/saved')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
  });

  test('✗ returns 401 without auth token', async () => {
    const res = await request(app).get('/api/resources/saved');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/booking/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/booking/:id', () => {
  test('✓ cancels a pending booking and restores the slot', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1, status: 'pending', slot_id: 5 }]]) // booking found
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // DELETE booking
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // restore slot

    const res = await request(app)
      .delete('/api/booking/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Booking cancelled.');
  });

  test('✗ returns 404 when booking not found or not owned by user', async () => {
    db.query.mockResolvedValueOnce([[]]); // no booking found

    const res = await request(app)
      .delete('/api/booking/999')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  test('✗ returns 409 when trying to cancel a confirmed booking', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'confirmed', slot_id: 5 }]]);

    const res = await request(app)
      .delete('/api/booking/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/confirmed/i);
  });

  test('✗ returns 401 without auth token', async () => {
    const res = await request(app).delete('/api/booking/1');
    expect(res.status).toBe(401);
  });
});
