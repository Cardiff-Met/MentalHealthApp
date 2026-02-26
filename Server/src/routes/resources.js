const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getResources } = require('../controllers/resourcesController');

router.use(authenticateToken);

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all mental health resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns array of resources
 *       401:
 *         description: Unauthorised
 */
router.get('/', getResources);

module.exports = router;
