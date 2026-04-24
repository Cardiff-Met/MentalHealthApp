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

// GET /api/therapist/slots — all slots owned by this therapist
async function getMySlots(req, res) {
  try {
    const [slots] = await db.query(
      `SELECT id, slot_date, slot_time, time_of_day, status
       FROM therapy_slots
       WHERE therapist_id = ?
       ORDER BY slot_date, slot_time`,
      [req.user.userId]
    );
    res.json({ slots });
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

  // Reject past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(slot_date) < today) {
    return res.status(400).json({ error: 'Cannot add slots in the past.' });
  }

  try {
    // Prevent duplicate
    const [existing] = await db.query(
      'SELECT id FROM therapy_slots WHERE slot_date = ? AND slot_time = ? AND therapist_id = ?',
      [slot_date, normalised, req.user.userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already have a slot at this time.' });
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

module.exports = { getMySlots, addSlot, removeSlot };
