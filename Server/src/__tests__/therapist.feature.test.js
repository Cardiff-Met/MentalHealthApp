/**
 * Functional Test Suite — Therapist Slot Management
 *
 * Tests the therapist-specific API pathway:
 *   GET /api/therapist/slots      — list all claimed slots
 *   POST /api/therapist/slots     — add an availability slot
 *   DELETE /api/therapist/slots/:id — remove a slot
 *   GET /api/therapist/bookings   — list bookings on own slots
 *
 * All DB calls are mocked; no live MySQL required.
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(overrides = {}) {
  return jwt.sign(
    { userId: 10, email: 'therapist@cardiffmet.ac.uk', role: 'therapist', ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

const THERAPIST_TOKEN = () => makeToken();
const USER_TOKEN = () => makeToken({ userId: 2, email: 'user@cardiffmet.ac.uk', role: 'user' });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/therapist/slots
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/therapist/slots', () => {
  test('returns 403 for a regular user', async () => {
    const res = await request(app)
      .get('/api/therapist/slots')
      .set('Authorization', `Bearer ${USER_TOKEN()}`);

    expect(res.status).toBe(403);
  });

  test('returns 200 and slots array for a therapist', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          slot_date: '2026-05-10',
          slot_time: '09:00:00',
          time_of_day: 'morning',
          status: 'available',
          therapist_id: 10,
          is_mine: 1,
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/therapist/slots')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    // is_mine should be coerced to a boolean
    expect(res.body.slots[0].is_mine).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/therapist/slots
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/therapist/slots', () => {
  test('adds a slot successfully for a future date', async () => {
    // No existing slot conflict
    db.query.mockResolvedValueOnce([[]]); // conflict check → none
    db.query.mockResolvedValueOnce([{ insertId: 42 }]); // INSERT

    const res = await request(app)
      .post('/api/therapist/slots')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`)
      .send({ slot_date: '2027-06-01', slot_time: '09:00' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('slot');
    expect(res.body.slot.slot_time).toBe('09:00:00');
  });

  test('returns 400 for a past date', async () => {
    const res = await request(app)
      .post('/api/therapist/slots')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`)
      .send({ slot_date: '2020-01-01', slot_time: '09:00' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/past/i);
  });

  test('returns 400 for an invalid slot time', async () => {
    const res = await request(app)
      .post('/api/therapist/slots')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`)
      .send({ slot_date: '2027-06-01', slot_time: '13:00' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid slot time/i);
  });

  test('returns 409 when the slot is already taken by another therapist', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 5,
          therapist_id: 99,
          therapist_name: 'Dr Smith',
          therapist_email: 'smith@cardiffmet.ac.uk',
        },
      ],
    ]);

    const res = await request(app)
      .post('/api/therapist/slots')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`)
      .send({ slot_date: '2027-06-01', slot_time: '09:00' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already covered/i);
  });

  test('returns 409 when the therapist already owns that slot', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 3,
          therapist_id: 10,
          therapist_name: null,
          therapist_email: 'therapist@cardiffmet.ac.uk',
        },
      ],
    ]);

    const res = await request(app)
      .post('/api/therapist/slots')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`)
      .send({ slot_date: '2027-06-01', slot_time: '09:00' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already have/i);
  });

  test('returns 403 for a regular user', async () => {
    const res = await request(app)
      .post('/api/therapist/slots')
      .set('Authorization', `Bearer ${USER_TOKEN()}`)
      .send({ slot_date: '2027-06-01', slot_time: '09:00' });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/therapist/slots/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/therapist/slots/:id', () => {
  test('removes an available slot successfully', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'available' }]]); // SELECT
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE

    const res = await request(app)
      .delete('/api/therapist/slots/1')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  test('returns 404 when slot does not belong to this therapist', async () => {
    db.query.mockResolvedValueOnce([[]]); // SELECT → not found

    const res = await request(app)
      .delete('/api/therapist/slots/999')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`);

    expect(res.status).toBe(404);
  });

  test('returns 409 when slot is already booked', async () => {
    db.query.mockResolvedValueOnce([[{ id: 2, status: 'pending' }]]);

    const res = await request(app)
      .delete('/api/therapist/slots/2')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/booked/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/therapist/bookings
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/therapist/bookings', () => {
  test('returns 200 and bookings for a therapist', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          status: 'pending',
          user_email: 'user@test.com',
          slot_date: '2027-06-01',
          slot_time: '09:00:00',
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/therapist/bookings')
      .set('Authorization', `Bearer ${THERAPIST_TOKEN()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  test('returns 403 for a regular user', async () => {
    const res = await request(app)
      .get('/api/therapist/bookings')
      .set('Authorization', `Bearer ${USER_TOKEN()}`);

    expect(res.status).toBe(403);
  });
});
