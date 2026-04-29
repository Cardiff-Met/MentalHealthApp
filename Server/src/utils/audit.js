const db = require('../db/connection');

/**
 * Append-only audit log writer.
 *
 * Silently swallows DB errors so a logging failure never breaks
 * the request that triggered it.
 *
 * @param {import('express').Request} req   - Express request (for ip / user-agent / user)
 * @param {string}                    action - Short slug, e.g. 'login_success'
 * @param {object|null}               metadata - Optional JSON payload
 */
async function audit(req, action, metadata = null) {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, action, ip, user_agent, metadata) VALUES (?, ?, ?, ?, ?)',
      [
        req.user?.userId ?? null,
        action,
        req.ip,
        req.headers['user-agent']?.slice(0, 255) ?? null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.error('[audit] write failed:', err.message);
  }
}

module.exports = { audit };
