const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getResources,
  saveResource,
  unsaveResource,
  getSavedResources,
} = require('../controllers/resourcesController');

router.use(authenticateToken);

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all mental health resources, optionally filtered by category
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [crisis, anxiety, self-help, mindfulness, general]
 *         required: false
 *         description: Filter resources by category
 *         example: anxiety
 *     responses:
 *       200:
 *         description: Returns array of resources
 *       401:
 *         description: Unauthorised
 */
router.get('/', getResources);

/**
 * @swagger
 * /api/resources/saved:
 *   get:
 *     summary: Get all resources saved by the authenticated user
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns array of saved resources with saved_at timestamp
 *       401:
 *         description: Unauthorised
 */
router.get('/saved', getSavedResources);

/**
 * @swagger
 * /api/resources/{id}/save:
 *   post:
 *     summary: Save a resource to the user's saved list
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Resource saved (idempotent — saving twice is safe)
 *       404:
 *         description: Resource not found
 *       401:
 *         description: Unauthorised
 */
router.post('/:id/save', saveResource);

/**
 * @swagger
 * /api/resources/{id}/save:
 *   delete:
 *     summary: Remove a resource from the user's saved list
 *     tags: [Resources]
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
 *         description: Resource removed from saved list
 *       404:
 *         description: Resource was not in saved list
 *       401:
 *         description: Unauthorised
 */
router.delete('/:id/save', unsaveResource);

module.exports = router;
