const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const db = require('../db/connection');

// GET /api/admin/users
// Returns a list of all registered users — admin only
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
