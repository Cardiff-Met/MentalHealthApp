const db = require('../db/connection');

// GET /api/resources
async function getResources(req, res) {
  try {
    const [resources] = await db.query('SELECT * FROM resources ORDER BY id ASC');
    res.json({ resources });
  } catch (err) {
    console.error('Resources error:', err);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
}

// POST /api/resources/:id/save
async function saveResource(req, res) {
  const resourceId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  try {
    const [resource] = await db.query('SELECT id FROM resources WHERE id = ?', [resourceId]);
    if (resource.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    await db.query('INSERT IGNORE INTO saved_resources (user_id, resource_id) VALUES (?, ?)', [
      userId,
      resourceId,
    ]);

    res.status(201).json({ message: 'Resource saved.' });
  } catch (err) {
    console.error('Save resource error:', err);
    res.status(500).json({ error: 'Failed to save resource.' });
  }
}

// DELETE /api/resources/:id/save
async function unsaveResource(req, res) {
  const resourceId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  try {
    const [result] = await db.query(
      'DELETE FROM saved_resources WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Saved resource not found.' });
    }

    res.json({ message: 'Resource removed from saved.' });
  } catch (err) {
    console.error('Unsave resource error:', err);
    res.status(500).json({ error: 'Failed to remove saved resource.' });
  }
}

// GET /api/resources/saved
async function getSavedResources(req, res) {
  const userId = req.user.userId;

  try {
    const [resources] = await db.query(
      `SELECT r.id, r.title, r.description, r.url, r.category, r.min_mood, r.max_mood, sr.saved_at
       FROM saved_resources sr
       JOIN resources r ON sr.resource_id = r.id
       WHERE sr.user_id = ?
       ORDER BY sr.saved_at DESC`,
      [userId]
    );

    res.json({ resources });
  } catch (err) {
    console.error('Get saved resources error:', err);
    res.status(500).json({ error: 'Failed to fetch saved resources.' });
  }
}

module.exports = { getResources, saveResource, unsaveResource, getSavedResources };
