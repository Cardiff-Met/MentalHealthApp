const db = require('../db/connection');

// GET /api/booking/slots
async function getSlots(req, res) {
  try {
    const [slots] = await db.query(
      'SELECT * FROM therapy_slots WHERE status = "available" ORDER BY slot_date, slot_time'
    );
    res.json({ slots });
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
}

// POST /api/booking
async function createBooking(req, res) {
  const { slotId } = req.body;
  const userId = req.user.userId;

  if (!slotId) {
    return res.status(400).json({ error: 'Slot ID is required.' });
  }

  try {
    // Check slot is still available (race condition protection)
    const [slots] = await db.query(
      'SELECT * FROM therapy_slots WHERE id = ? AND status = "available"',
      [slotId]
    );

    if (slots.length === 0) {
      return res
        .status(409)
        .json({ error: 'This time slot is no longer available. Please select another.' });
    }

    // Lock the slot
    await db.query('UPDATE therapy_slots SET status = "pending" WHERE id = ?', [slotId]);

    // Create booking record
    const [result] = await db.query(
      'INSERT INTO bookings (user_id, slot_id, status) VALUES (?, ?, "pending")',
      [userId, slotId]
    );

    res.status(201).json({
      message: 'Booking request submitted.',
      bookingId: result.insertId,
      status: 'pending',
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to create booking. Please try again.' });
  }
}

// GET /api/booking/my
async function getMyBookings(req, res) {
  const userId = req.user.userId;

  try {
    const [bookings] = await db.query(
      `SELECT b.id, b.status, b.created_at, 
              t.slot_date, t.slot_time, t.time_of_day
       FROM bookings b
       JOIN therapy_slots t ON b.slot_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );
    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

// DELETE /api/booking/:id
async function cancelBooking(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  try {
    // Fetch booking and verify ownership
    const [rows] = await db.query(
      'SELECT b.id, b.status, b.slot_id FROM bookings b WHERE b.id = ? AND b.user_id = ?',
      [bookingId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = rows[0];

    if (booking.status === 'confirmed') {
      return res
        .status(409)
        .json({
          error: 'Confirmed bookings cannot be cancelled. Please contact the wellbeing team.',
        });
    }

    if (booking.status === 'declined') {
      return res.status(409).json({ error: 'This booking has already been declined.' });
    }

    // Delete booking and restore slot to available
    await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
    await db.query('UPDATE therapy_slots SET status = "available" WHERE id = ?', [booking.slot_id]);

    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking. Please try again.' });
  }
}

module.exports = { getSlots, createBooking, getMyBookings, cancelBooking };
