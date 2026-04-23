const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { isValidEmail, isValidPassword } = require('../utils/validation');

const SALT_ROUNDS = 10;

// GET /api/users/me
async function getProfile(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Could not retrieve profile. Please try again.' });
  }
}

// PATCH /api/users/me
async function updateProfile(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    // Check email not already taken by another account
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
      [email, req.user.userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'That email is already in use.' });
    }

    await db.query('UPDATE users SET email = ? WHERE id = ? AND deleted_at IS NULL', [
      email,
      req.user.userId,
    ]);

    const [rows] = await db.query('SELECT id, email, role, created_at FROM users WHERE id = ?', [
      req.user.userId,
    ]);

    res.json({ message: 'Profile updated.', user: rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Could not update profile. Please try again.' });
  }
}

// PATCH /api/users/me/password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT password FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Could not change password. Please try again.' });
  }
}

// DELETE /api/users/me  — GDPR Right to Erasure (soft-delete)
async function deleteAccount(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT password FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Soft-delete the user
    await db.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [req.user.userId]);

    // Anonymise mood log descriptions (GDPR — remove personal content)
    await db.query('UPDATE mood_logs SET description = NULL WHERE user_id = ?', [req.user.userId]);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Account deleted. Your data has been anonymised.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Could not delete account. Please try again.' });
  }
}

// GET /api/users/me/export  — GDPR Right to Data Portability
async function exportData(req, res) {
  try {
    const [users] = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [moodLogs] = await db.query(
      'SELECT id, rating, description, logged_at FROM mood_logs WHERE user_id = ? ORDER BY logged_at DESC',
      [req.user.userId]
    );

    const [bookings] = await db.query(
      `SELECT b.id, b.status, b.created_at,
              ts.slot_date, ts.slot_time, ts.time_of_day
       FROM bookings b
       JOIN therapy_slots ts ON b.slot_id = ts.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );

    const [savedResources] = await db.query(
      `SELECT r.id, r.title, r.description, r.url, sr.saved_at
       FROM saved_resources sr
       JOIN resources r ON sr.resource_id = r.id
       WHERE sr.user_id = ?
       ORDER BY sr.saved_at DESC`,
      [req.user.userId]
    );

    res.json({
      exportedAt: new Date().toISOString(),
      user: users[0],
      mood_logs: moodLogs,
      bookings,
      saved_resources: savedResources,
    });
  } catch (err) {
    console.error('Export data error:', err);
    res.status(500).json({ error: 'Could not export data. Please try again.' });
  }
}

module.exports = { getProfile, updateProfile, changePassword, deleteAccount, exportData };
