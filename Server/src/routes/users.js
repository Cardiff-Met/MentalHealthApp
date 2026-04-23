const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  exportData,
} = require('../controllers/userController');

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: student@cardiffmet.ac.uk
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: No token provided
 *       404:
 *         description: User not found or account deleted
 */
router.get('/me', authenticateToken, getProfile);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update the authenticated user's email address
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: newaddress@cardiffmet.ac.uk
 *     responses:
 *       200:
 *         description: Profile updated, returns updated user object
 *       400:
 *         description: Missing or invalid email format
 *       401:
 *         description: No token provided
 *       409:
 *         description: Email already in use by another account
 */
router.patch('/me', authenticateToken, updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   patch:
 *     summary: Change the authenticated user's password
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPass123
 *               newPassword:
 *                 type: string
 *                 example: NewPass456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing fields or new password too short (min 8 chars)
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 */
router.patch('/me/password', authenticateToken, changePassword);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete the authenticated user's account (GDPR Right to Erasure)
 *     description: >
 *       Soft-deletes the user account and anonymises all mood log descriptions.
 *       Requires password confirmation. The refresh token cookie is cleared.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: MyCurrentPass123
 *     responses:
 *       200:
 *         description: Account soft-deleted and mood log descriptions anonymised
 *       400:
 *         description: Password not provided
 *       401:
 *         description: Incorrect password
 *       404:
 *         description: User not found
 */
router.delete('/me', authenticateToken, deleteAccount);

/**
 * @swagger
 * /api/users/me/export:
 *   get:
 *     summary: Export all personal data as JSON (GDPR Right to Data Portability)
 *     description: >
 *       Returns a single JSON object containing the user's profile, all mood log
 *       entries, therapy bookings, and saved resources.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full data export
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 *                 user:
 *                   type: object
 *                 mood_logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                 saved_resources:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: No token provided
 *       404:
 *         description: User not found
 */
router.get('/me/export', authenticateToken, exportData);

module.exports = router;
