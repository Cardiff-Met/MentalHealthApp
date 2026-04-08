const requireAdmin = require('../middleware/requireAdmin');

// Helper: build a mock res object with chainable .status().json()
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireAdmin middleware', () => {
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

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden. Admin access required.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is "user"', () => {
    const req = { user: { userId: 1, role: 'user' } };
    const res = mockRes();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is an empty string', () => {
    const req = { user: { userId: 2, role: '' } };
    const res = mockRes();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is undefined', () => {
    const req = { user: { userId: 3 } };
    const res = mockRes();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Allowed case
  // -------------------------------------------------------------------------
  test('calls next() when user role is "admin"', () => {
    const req = { user: { userId: 99, role: 'admin' } };
    const res = mockRes();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
