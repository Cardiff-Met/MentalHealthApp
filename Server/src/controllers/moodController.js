const db = require('../db/connection');

// POST /api/mood
async function logMood(req, res) {
    const { rating, description } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Mood rating must be between 1 and 5.' });
    }

    try {
        await db.query(
            'INSERT INTO mood_logs (user_id, rating, description) VALUES (?, ?, ?)',
            [userId, rating, description || null]
        );

        // Fetch personalised resources based on mood rating
        const [resources] = await db.query(
            'SELECT * FROM resources WHERE min_mood <= ? AND max_mood >= ? LIMIT 3',
            [rating, rating]
        );

        res.status(201).json({
            message: 'Mood logged successfully.',
            isCrisis: rating === 1,
            resources,
        });
    } catch (err) {
        console.error('Mood log error:', err);
        res.status(500).json({ error: 'Failed to log mood. Please try again.' });
    }
}

// GET /api/mood/history
async function getMoodHistory(req, res) {
    const userId = req.user.userId;

    try {
        const [logs] = await db.query(
            'SELECT id, rating, description, logged_at FROM mood_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30',
            [userId]
        );
        res.json({ logs });
    } catch (err) {
        console.error('Mood history error:', err);
        res.status(500).json({ error: 'Failed to fetch mood history.' });
    }
}

module.exports = { logMood, getMoodHistory };