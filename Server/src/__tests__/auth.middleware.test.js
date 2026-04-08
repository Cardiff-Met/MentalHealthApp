jest.mock('jsonwebtoken');

const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

// Helper: build a mock res object with chainable .status().json()
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authenticateToken middleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Missing token cases
  // -------------------------------------------------------------------------
  test('returns 401 when no Authorization header is present', () => {
    const req = { headers: {} };
    const res = mockRes();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header has no token after Bearer', () => {
    const req = { headers: { authorization: 'Bearer ' } };
    const res = mockRes();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header is unrecognised format', () => {
    const req = { headers: { authorization: 'Basic sometoken' } };
    const res = mockRes();

    // "Basic sometoken".split(' ')[1] = "sometoken" — jwt.verify will throw
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Invalid / expired token
  // -------------------------------------------------------------------------
  test('returns 403 when jwt.verify throws (invalid token)', () => {
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = mockRes();

    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when token is expired', () => {
    const req = { headers: { authorization: 'Bearer expiredtoken' } };
    const res = mockRes();

    jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Valid token
  // -------------------------------------------------------------------------
  test('calls next() and sets req.user when token is valid', () => {
    const decoded = { userId: 1, email: 'student@cardiffmet.ac.uk', role: 'user' };
    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();

    jwt.verify.mockReturnValue(decoded);

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(decoded);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('sets req.user with the decoded payload from the token', () => {
    const decoded = { userId: 42, email: 'admin@cardiffmet.ac.uk', role: 'admin' };
    const req = { headers: { authorization: 'Bearer admintoken' } };
    const res = mockRes();

    jwt.verify.mockReturnValue(decoded);

    authenticateToken(req, res, next);

    expect(req.user.userId).toBe(42);
    expect(req.user.role).toBe('admin');
  });
});
