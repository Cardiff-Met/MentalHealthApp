const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const requireTherapist = require('../middleware/requireTherapist');
const {
  getMySlots,
  addSlot,
  removeSlot,
  getMyBookings,
  updateBooking,
} = require('../controllers/therapistController');

router.use(authenticateToken, requireTherapist);

/**
 * @swagger
 * /api/therapist/slots:
 *   get:
 *     summary: Get all slots owned by the authenticated therapist
 *     tags: [Therapist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of the therapist's slots
 *       403:
 *         description: Therapist access required
 */
router.get('/slots', getMySlots);

/**
 * @swagger
 * /api/therapist/slots:
 *   post:
 *     summary: Add an availability slot
 *     tags: [Therapist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slot_date, slot_time]
 *             properties:
 *               slot_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-06"
 *               slot_time:
 *                 type: string
 *                 example: "09:00"
 *     responses:
 *       201:
 *         description: Slot added
 *       400:
 *         description: Invalid date or time
 *       409:
 *         description: Slot already exists
 */
router.post('/slots', addSlot);

/**
 * @swagger
 * /api/therapist/slots/{id}:
 *   delete:
 *     summary: Remove an available slot
 *     tags: [Therapist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Slot removed
 *       404:
 *         description: Slot not found or not owned by therapist
 *       409:
 *         description: Slot already booked — cannot remove
 */
router.delete('/slots/:id', removeSlot);

/**
 * @swagger
 * /api/therapist/bookings:
 *   get:
 *     summary: List bookings made on the authenticated therapist's slots
 *     tags: [Therapist]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bookings', getMyBookings);

/**
 * @swagger
 * /api/therapist/bookings/{id}:
 *   patch:
 *     summary: Confirm or decline a booking on one of the therapist's own slots
 *     tags: [Therapist]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/bookings/:id', updateBooking);

module.exports = router;
