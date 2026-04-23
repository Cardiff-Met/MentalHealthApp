const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const db = require('../db/connection');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all registered users
 *     description: Returns every user account. Requires admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all user accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       email:
 *                         type: string
 *                         example: student@cardiffmet.ac.uk
 *                       role:
 *                         type: string
 *                         enum: [user, admin]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No token provided
 *       403:
 *         description: Admin role required
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

module.exports = router;
