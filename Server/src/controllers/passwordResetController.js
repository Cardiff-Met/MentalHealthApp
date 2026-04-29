const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { isValidPassword } = require('../utils/validation');
const { audit } = require('../utils/audit');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY_MINUTES = 30;

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [
      email,
    ]);

    // Always return 200 — never reveal whether an email exists (prevents enumeration)
    if (rows.length === 0) {
      return res.status(200).json({
        message: 'If that email exists you will receive a reset link shortly.',
      });
    }

    const userId = rows[0].id;

    // Invalidate any existing unused tokens for this user
    await db.query(
      'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [userId]
    );

    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );

    // In production this would be sent via email (SendGrid / SES).
    // For demo purposes the reset link is logged to the server console.
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    console.log(`[PASSWORD RESET] Reset link for ${email}: ${resetLink}`);

    await audit(req, 'forgot_password', { userId });
    res.status(200).json({
      message: 'If that email exists you will receive a reset link shortly.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Could not process request. Please try again.' });
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await db.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
       FROM password_resets pr
       WHERE pr.token_hash = ?`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const reset = rows[0];

    // Check already used
    if (reset.used_at !== null) {
      return res.status(400).json({ error: 'This reset link has already been used.' });
    }

    // Check expiry
    if (new Date() > new Date(reset.expires_at)) {
      return res
        .status(400)
        .json({ error: 'This reset link has expired. Please request a new one.' });
    }

    // Hash new password and update user
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, reset.user_id]);

    // Mark token as used
    await db.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);

    await audit(req, 'reset_password', { userId: reset.user_id });
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
}

module.exports = { forgotPassword, resetPassword };
