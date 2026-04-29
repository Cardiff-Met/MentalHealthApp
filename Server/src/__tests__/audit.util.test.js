/**
 * Unit Tests — audit utility (Server/src/utils/audit.js)
 *
 * Verifies that:
 *  - audit() inserts the correct values into audit_log
 *  - audit() handles missing req.user gracefully (unauthenticated requests)
 *  - audit() swallows DB errors without throwing
 */

jest.mock('../db/connection');

const db = require('../db/connection');
const { audit } = require('../utils/audit');

function makeReq(overrides = {}) {
  return {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/test' },
    user: { userId: 1 },
    ...overrides,
  };
}

describe('audit utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue([{ affectedRows: 1 }]);
  });

  test('calls db.query with correct action and user_id', async () => {
    const req = makeReq();
    await audit(req, 'login_success');

    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO audit_log/);
    expect(params[0]).toBe(1);           // user_id
    expect(params[1]).toBe('login_success'); // action
    expect(params[2]).toBe('127.0.0.1'); // ip
  });

  test('sets user_id to null when req.user is absent', async () => {
    const req = makeReq({ user: undefined });
    await audit(req, 'forgot_password');

    const [, params] = db.query.mock.calls[0];
    expect(params[0]).toBeNull();
  });

  test('serialises metadata as JSON string', async () => {
    const req = makeReq();
    await audit(req, 'admin_update_role', { targetUserId: 5, newRole: 'admin' });

    const [, params] = db.query.mock.calls[0];
    expect(params[4]).toBe(JSON.stringify({ targetUserId: 5, newRole: 'admin' }));
  });

  test('sets metadata to null when not provided', async () => {
    const req = makeReq();
    await audit(req, 'logout');

    const [, params] = db.query.mock.calls[0];
    expect(params[4]).toBeNull();
  });

  test('truncates user-agent to 255 characters', async () => {
    const longAgent = 'A'.repeat(300);
    const req = makeReq({ headers: { 'user-agent': longAgent } });
    await audit(req, 'login_success');

    const [, params] = db.query.mock.calls[0];
    expect(params[3].length).toBe(255);
  });

  test('does not throw when db.query rejects', async () => {
    db.query.mockRejectedValue(new Error('DB connection lost'));
    const req = makeReq();

    await expect(audit(req, 'login_success')).resolves.toBeUndefined();
  });
});
