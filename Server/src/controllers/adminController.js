const db = require('../db/connection');
const { audit } = require('../utils/audit');

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const [users] = await db.query(
      'SELECT id, email, name, role, created_at, deleted_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

// GET /api/admin/resources
async function listResources(req, res) {
  try {
    const [resources] = await db.query('SELECT * FROM resources ORDER BY id ASC');
    res.json({ resources });
  } catch (err) {
    console.error('Admin list resources error:', err);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
}

const VALID_CATEGORIES = ['general', 'crisis', 'anxiety', 'self-help', 'mindfulness'];

// POST /api/admin/resources
async function createResource(req, res) {
  const { title, description, url, categories, min_mood, max_mood } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required.' });
  }

  const cats = Array.isArray(categories) && categories.length > 0 ? categories : ['general'];
  const invalid = cats.filter((c) => !VALID_CATEGORIES.includes(c));
  if (invalid.length > 0) {
    return res.status(400).json({ error: `Invalid categories: ${invalid.join(', ')}.` });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO resources (title, description, url, category, categories, min_mood, max_mood) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, url, cats[0], JSON.stringify(cats), min_mood ?? 1, max_mood ?? 5]
    );
    res.status(201).json({ message: 'Resource created.', resourceId: result.insertId });
  } catch (err) {
    console.error('Admin create resource error:', err);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
}

// PATCH /api/admin/resources/:id
async function updateResource(req, res) {
  const resourceId = parseInt(req.params.id, 10);
  const { title, description, url, categories, min_mood, max_mood } = req.body;

  try {
    const [rows] = await db.query('SELECT id FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const cats = Array.isArray(categories) && categories.length > 0 ? categories : null;

    await db.query(
      `UPDATE resources
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           url = COALESCE(?, url),
           category = COALESCE(?, category),
           categories = COALESCE(?, categories),
           min_mood = COALESCE(?, min_mood),
           max_mood = COALESCE(?, max_mood)
       WHERE id = ?`,
      [
        title ?? null,
        description ?? null,
        url ?? null,
        cats ? cats[0] : null,
        cats ? JSON.stringify(cats) : null,
        min_mood ?? null,
        max_mood ?? null,
        resourceId,
      ]
    );

    res.json({ message: 'Resource updated.' });
  } catch (err) {
    console.error('Admin update resource error:', err);
    res.status(500).json({ error: 'Failed to update resource.' });
  }
}

// DELETE /api/admin/resources/:id
async function deleteResource(req, res) {
  const resourceId = parseInt(req.params.id, 10);

  try {
    const [rows] = await db.query('SELECT id FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    await db.query('DELETE FROM resources WHERE id = ?', [resourceId]);
    res.json({ message: 'Resource deleted.' });
  } catch (err) {
    console.error('Admin delete resource error:', err);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
}

// PATCH /api/admin/users/:id/role
async function updateUserRole(req, res) {
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (!['user', 'therapist', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be "user", "therapist", or "admin".' });
  }

  if (userId === req.user.userId) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  try {
    const [rows] = await db.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [
      userId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    await audit(req, 'admin_update_role', { targetUserId: userId, newRole: role });
    res.json({ message: `User role updated to ${role}.` });
  } catch (err) {
    console.error('Admin update role error:', err);
    res.status(500).json({ error: 'Failed to update role.' });
  }
}

// GET /api/admin/bookings
async function listBookings(req, res) {
  try {
    const [bookings] = await db.query(
      `SELECT b.id, b.status, b.created_at,
              u.email AS user_email,
              t.slot_date, t.slot_time, t.time_of_day
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN therapy_slots t ON b.slot_id = t.id
       ORDER BY b.created_at DESC`
    );
    res.json({ bookings });
  } catch (err) {
    console.error('Admin list bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

// PATCH /api/admin/bookings/:id
async function updateBooking(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status || !['confirmed', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'status must be "confirmed" or "declined".' });
  }

  try {
    const [rows] = await db.query(
      'SELECT b.id, b.status, b.slot_id FROM bookings b WHERE b.id = ?',
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = rows[0];

    if (booking.status === 'confirmed' || booking.status === 'declined') {
      return res.status(409).json({ error: `Booking is already ${booking.status}.` });
    }

    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

    // If declined, restore the slot to available
    if (status === 'declined') {
      await db.query('UPDATE therapy_slots SET status = "available" WHERE id = ?', [
        booking.slot_id,
      ]);
    }

    // If confirmed, mark the slot as confirmed (matches therapy_slots.status ENUM)
    if (status === 'confirmed') {
      await db.query('UPDATE therapy_slots SET status = "confirmed" WHERE id = ?', [
        booking.slot_id,
      ]);
    }

    await audit(req, 'admin_update_booking', { bookingId, status });
    res.json({ message: `Booking ${status}.` });
  } catch (err) {
    console.error('Admin update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  listResources,
  createResource,
  updateResource,
  deleteResource,
  listBookings,
  updateBooking,
};
