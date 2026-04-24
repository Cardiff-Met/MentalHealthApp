const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  listUsers,
  updateUserRole,
  listResources,
  createResource,
  updateResource,
  deleteResource,
  listBookings,
  updateBooking,
} = require('../controllers/adminController');

router.use(authenticateToken, requireAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all registered users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all user accounts
 *       401:
 *         description: No token provided
 *       403:
 *         description: Admin role required
 */
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

/**
 * @swagger
 * /api/admin/resources:
 *   get:
 *     summary: List all resources
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all resources
 *       403:
 *         description: Admin role required
 */
router.get('/resources', listResources);

/**
 * @swagger
 * /api/admin/resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, url, category]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               url:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [crisis, anxiety, self-help, mindfulness, general]
 *               min_mood:
 *                 type: integer
 *               max_mood:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Resource created
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Admin role required
 */
router.post('/resources', createResource);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   patch:
 *     summary: Update a resource
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               url:
 *                 type: string
 *               category:
 *                 type: string
 *               min_mood:
 *                 type: integer
 *               max_mood:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Resource updated
 *       404:
 *         description: Resource not found
 *       403:
 *         description: Admin role required
 */
router.patch('/resources/:id', updateResource);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     tags: [Admin]
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
 *         description: Resource deleted
 *       404:
 *         description: Resource not found
 *       403:
 *         description: Admin role required
 */
router.delete('/resources/:id', deleteResource);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: List all bookings with user and slot details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all bookings
 *       403:
 *         description: Admin role required
 */
router.get('/bookings', listBookings);

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   patch:
 *     summary: Confirm or decline a booking
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, declined]
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Booking already confirmed or declined
 *       403:
 *         description: Admin role required
 */
router.patch('/bookings/:id', updateBooking);

module.exports = router;
