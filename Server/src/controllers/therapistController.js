const db = require('../db/connection');

const VALID_TIMES = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00'];

const TIME_OF_DAY = {
  '09:00:00': 'morning',
  '10:00:00': 'morning',
  '11:00:00': 'morning',
  '14:00:00': 'afternoon',
  '15:00:00': 'afternoon',
  '16:00:00': 'afternoon',
};

// GET /api/therapist/slots — every slot, with an `is_mine` flag and the
// owner's name/email so therapists can see each other's availability and
// avoid scheduling on top of each other.
async function getMySlots(req, res) {
  try {
    const [slots] = await db.query(
      `SELECT t.id, t.slot_date, t.slot_time, t.time_of_day, t.status,
              t.therapist_id,
              (t.therapist_id = ?) AS is_mine,
              u.name AS therapist_name, u.email AS therapist_email
       FROM therapy_slots t
       LEFT JOIN users u ON t.therapist_id = u.id
       WHERE t.therapist_id IS NOT NULL
       ORDER BY t.slot_date, t.slot_time`,
      [req.user.userId]
    );
    // Coerce the MySQL 0/1 to a JS boolean for the client
    res.json({ slots: slots.map((s) => ({ ...s, is_mine: !!s.is_mine })) });
  } catch (err) {
    console.error('Get therapist slots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
}

// POST /api/therapist/slots — add an availability slot
async function addSlot(req, res) {
  const { slot_date, slot_time } = req.body;

  if (!slot_date || !slot_time) {
    return res.status(400).json({ error: 'slot_date and slot_time are required.' });
  }

  const normalised = slot_time.length === 5 ? `${slot_time}:00` : slot_time;

  if (!VALID_TIMES.includes(normalised)) {
    return res.status(400).json({
      error: 'Invalid slot time. Must be 09:00, 10:00, 11:00, 14:00, 15:00, or 16:00.',
    });
  }

  // Reject past dates — compare YYYY-MM-DD strings to avoid timezone drift
  // between the server (UTC in Docker) and the client.
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const slotDateStr = String(slot_date).slice(0, 10);

  if (slotDateStr < todayStr) {
    return res.status(400).json({ error: 'Cannot add slots in the past.' });
  }
  // If the slot is for today, also reject times that have already passed.
  if (slotDateStr === todayStr) {
    const nowHHMM = now.toISOString().slice(11, 16); // "HH:MM" in UTC
    const slotHHMM = normalised.slice(0, 5);
    if (slotHHMM <= nowHHMM) {
      return res.status(400).json({ error: 'That time has already passed today.' });
    }
  }

  try {
    // Prevent any therapist from holding the same date+time — global uniqueness
    const [existing] = await db.query(
      `SELECT t.id, t.therapist_id, u.name AS therapist_name, u.email AS therapist_email
       FROM therapy_slots t
       LEFT JOIN users u ON t.therapist_id = u.id
       WHERE t.slot_date = ? AND t.slot_time = ? AND t.therapist_id IS NOT NULL`,
      [slot_date, normalised]
    );
    if (existing.length > 0) {
      const owner = existing[0];
      const isMine = owner.therapist_id === req.user.userId;
      return res.status(409).json({
        error: isMine
          ? 'You already have a slot at this time.'
          : `This time is already covered by ${owner.therapist_name || owner.therapist_email}.`,
      });
    }

    const [result] = await db.query(
      `INSERT INTO therapy_slots (slot_date, slot_time, time_of_day, status, therapist_id)
       VALUES (?, ?, ?, 'available', ?)`,
      [slot_date, normalised, TIME_OF_DAY[normalised], req.user.userId]
    );

    res.status(201).json({
      message: 'Slot added.',
      slot: {
        id: result.insertId,
        slot_date,
        slot_time: normalised,
        time_of_day: TIME_OF_DAY[normalised],
        status: 'available',
      },
    });
  } catch (err) {
    console.error('Add slot error:', err);
    res.status(500).json({ error: 'Failed to add slot.' });
  }
}

// DELETE /api/therapist/slots/:id — remove an available slot
async function removeSlot(req, res) {
  const slotId = parseInt(req.params.id, 10);

  try {
    const [rows] = await db.query(
      'SELECT id, status FROM therapy_slots WHERE id = ? AND therapist_id = ?',
      [slotId, req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (rows[0].status !== 'available') {
      return res.status(409).json({ error: 'Cannot remove a slot that has already been booked.' });
    }

    await db.query('DELETE FROM therapy_slots WHERE id = ?', [slotId]);
    res.json({ message: 'Slot removed.' });
  } catch (err) {
    console.error('Remove slot error:', err);
    res.status(500).json({ error: 'Failed to remove slot.' });
  }
}

// GET /api/therapist/bookings — bookings on this therapist's slots
async function getMyBookings(req, res) {
  try {
    const [bookings] = await db.query(
      `SELECT b.id, b.status, b.created_at,
              u.email AS user_email, u.name AS user_name,
              t.id AS slot_id, t.slot_date, t.slot_time, t.time_of_day
       FROM bookings b
       JOIN therapy_slots t ON b.slot_id = t.id
       JOIN users u ON b.user_id = u.id
       WHERE t.therapist_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );
    res.json({ bookings });
  } catch (err) {
    console.error('Get therapist bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

// PATCH /api/therapist/bookings/:id — confirm/decline a booking on own slot
async function updateBooking(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status || !['confirmed', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'status must be "confirmed" or "declined".' });
  }

  try {
    const [rows] = await db.query(
      `SELECT b.id, b.status, b.slot_id, t.therapist_id
       FROM bookings b
       JOIN therapy_slots t ON b.slot_id = t.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = rows[0];

    if (booking.therapist_id !== req.user.userId) {
      return res.status(403).json({ error: 'You can only manage bookings on your own slots.' });
    }

    if (booking.status === 'confirmed' || booking.status === 'declined') {
      return res.status(409).json({ error: `Booking is already ${booking.status}.` });
    }

    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

    if (status === 'declined') {
      await db.query('UPDATE therapy_slots SET status = "available" WHERE id = ?', [
        booking.slot_id,
      ]);
    }
    if (status === 'confirmed') {
      await db.query('UPDATE therapy_slots SET status = "confirmed" WHERE id = ?', [
        booking.slot_id,
      ]);
    }

    res.json({ message: `Booking ${status}.` });
  } catch (err) {
    console.error('Therapist update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
}

module.exports = { getMySlots, addSlot, removeSlot, getMyBookings, updateBooking };
