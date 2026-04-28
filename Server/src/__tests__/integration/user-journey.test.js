/**
 * Integration Test — Full Student User Journey
 *
 * Exercises the complete pathway a student would take:
 *   1. Register a new account
 *   2. Log in with the same credentials
 *   3. Submit a mood log and receive resources
 *   4. List available therapy slots
 *   5. Book a slot
 *   6. View their bookings
 *   7. Cancel the booking
 *
 * The DB is mocked (no live MySQL needed). Each step verifies that the
 * server responds with the expected status / shape and that the JWT
 * issued at login authenticates all subsequent calls.
 */

jest.mock('../../db/connection');
jest.mock('bcrypt');

const request = require('supertest');
const app = require('../../app');
const db = require('../../db/connection');
const bcrypt = require('bcrypt');

beforeAll(() => {
  process.env.JWT_SECRET = 'integration-test-secret-32-chars-min';
  process.env.REFRESH_SECRET = 'integration-test-refresh-secret-32';
  process.env.NODE_ENV = 'test';
});

beforeEach(() => jest.clearAllMocks());

describe('Integration — student user journey end-to-end', () => {
  let accessToken;

  test('Step 1 — register creates account and returns access token', async () => {
    db.query
      .mockResolvedValueOnce([[]]) // no existing user
      .mockResolvedValueOnce([{ insertId: 42 }]); // INSERT
    bcrypt.hash.mockResolvedValue('hashed-password');

    const res = await request(app).post('/api/auth/register').send({
      email: 'journey@cardiffmet.ac.uk',
      password: 'Securepass1',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
  });

  test('Step 2 — login with same credentials returns a fresh token', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 42,
          email: 'journey@cardiffmet.ac.uk',
          password: 'hashed-password',
          role: 'user',
        },
      ],
    ]);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app).post('/api/auth/login').send({
      email: 'journey@cardiffmet.ac.uk',
      password: 'Securepass1',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken; // overwrite with login token
  });

  test('Step 3 — log a mood and receive personalised resources', async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT mood_log
      .mockResolvedValueOnce([[{ id: 1, title: 'Mindfulness Tips', min_mood: 2, max_mood: 4 }]]); // SELECT resources

    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 3, description: 'A bit stressed about exams.' });

    expect(res.status).toBe(201);
    expect(res.body.resources).toHaveLength(1);
  });

  test('Step 4 — list available therapy slots', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 7,
          slot_date: '2026-05-01',
          slot_time: '10:00:00',
          status: 'available',
          therapist_email: 't@cardiffmet.ac.uk',
          therapist_name: 'Dr Smith',
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/booking/slots')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(1);
    expect(res.body.slots[0].id).toBe(7);
  });

  test('Step 5 — book a slot', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 7, status: 'available' }]]) // slot still available
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE slot to pending
      .mockResolvedValueOnce([{ insertId: 99 }]); // INSERT booking

    const res = await request(app)
      .post('/api/booking')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slotId: 7 });

    expect(res.status).toBe(201);
    expect(res.body.bookingId).toBe(99);
    expect(res.body.status).toBe('pending');
  });

  test('Step 6 — view my bookings shows the new booking', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 99,
          status: 'pending',
          created_at: new Date().toISOString(),
          slot_date: '2026-05-01',
          slot_time: '10:00:00',
          therapist_email: 't@cardiffmet.ac.uk',
          therapist_name: 'Dr Smith',
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/booking/my')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].id).toBe(99);
  });

  test('Step 7 — cancel the booking', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 99, status: 'pending', slot_id: 7 }]]) // ownership check
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // DELETE booking
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE slot back to available

    const res = await request(app)
      .delete('/api/booking/99')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled/i);
  });
});
