const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { logMood, getMoodHistory } = require('../controllers/moodController');

// All mood routes require authentication
router.use(authenticateToken);

// POST /api/mood — log a new mood entry
router.post('/', logMood);

// GET /api/mood/history — get past mood logs
router.get('/history', getMoodHistory);

module.exports = router;