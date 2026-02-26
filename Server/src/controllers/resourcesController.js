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

module.exports = { getResources };