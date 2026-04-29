/**
 * Unit Tests — requireTherapist middleware
 *
 * Mirrors the requireAdmin middleware test suite.
 * Note: admins are also allowed through (therapist OR admin).
 */

const requireTherapist = require('../middleware/requireTherapist');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireTherapist middleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
  });

  // -------------------------------------------------------------------------
  // Blocked cases
  // -------------------------------------------------------------------------
  test('returns 403 when req.user is undefined', () => {
    const req = {};
    const res = mockRes();

    requireTherapist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Therapist access required.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is "user"', () => {
    const req = { user: { userId: 1, role: 'user' } };
    const res = mockRes();

    requireTherapist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is an empty string', () => {
    const req = { user: { userId: 2, role: '' } };
    const res = mockRes();

    requireTherapist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is undefined', () => {
    const req = { user: { userId: 3 } };
    const res = mockRes();

    requireTherapist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Allowed cases
  // -------------------------------------------------------------------------
  test('calls next() when user role is "therapist"', () => {
    const req = { user: { userId: 10, role: 'therapist' } };
    const res = mockRes();

    requireTherapist(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('calls next() when user role is "admin" (admins bypass therapist guard)', () => {
    const req = { user: { userId: 99, role: 'admin' } };
    const res = mockRes();

    requireTherapist(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
