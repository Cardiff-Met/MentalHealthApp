const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
} = require('../controllers/bookingController');

router.use(authenticateToken);

/**
 * @swagger
 * /api/booking/slots:
 *   get:
 *     summary: Get all available therapy slots
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns array of available slots
 *       401:
 *         description: Unauthorised
 */
router.get('/slots', getSlots);

/**
 * @swagger
 * /api/booking/my:
 *   get:
 *     summary: Get all bookings for the logged in user
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns array of bookings with slot details
 *       401:
 *         description: Unauthorised
 */
router.get('/my', getMyBookings);

/**
 * @swagger
 * /api/booking:
 *   post:
 *     summary: Submit a therapy session booking request
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotId]
 *             properties:
 *               slotId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Booking request submitted with status pending
 *       409:
 *         description: Slot no longer available
 *       401:
 *         description: Unauthorised
 */
router.post('/', createBooking);

/**
 * @swagger
 * /api/booking/{id}:
 *   delete:
 *     summary: Cancel a pending booking
 *     description: >
 *       Cancels the booking and restores the therapy slot to available.
 *       Only the booking owner can cancel. Confirmed bookings cannot be cancelled.
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID to cancel
 *     responses:
 *       200:
 *         description: Booking cancelled and slot restored
 *       404:
 *         description: Booking not found or not owned by user
 *       409:
 *         description: Booking is confirmed or already declined — cannot cancel
 *       401:
 *         description: Unauthorised
 */
router.delete('/:id', cancelBooking);

module.exports = router;
