const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { logMood, getMoodHistory } = require('../controllers/moodController');

router.use(authenticateToken);

/**
 * @swagger
 * /api/mood:
 *   post:
 *     summary: Log a mood entry and receive personalised resources
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               description:
 *                 type: string
 *                 example: Feeling okay but stressed about deadlines
 *     responses:
 *       201:
 *         description: Mood logged, returns resources and isCrisis flag
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Unauthorised
 */
router.post('/', logMood);

/**
 * @swagger
 * /api/mood/history:
 *   get:
 *     summary: Get the last 30 mood entries for the logged in user
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns array of mood logs
 *       401:
 *         description: Unauthorised
 */
router.get('/history', getMoodHistory);

module.exports = router;