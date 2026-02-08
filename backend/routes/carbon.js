const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's carbon logs
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [logs] = await db.promise().query(
            'SELECT * FROM carbon_logs WHERE user_id = ? ORDER BY logged_at DESC',
            [userId]
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Log carbon savings
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { amount_kg, source } = req.body;

    if (!amount_kg || !source) {
        return res.status(400).json({ message: 'Amount and source are required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO carbon_logs (user_id, amount_kg, source) VALUES (?, ?, ?)',
            [userId, amount_kg, source]
        );
        res.status(201).json({ message: 'Carbon log added', logId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get carbon savings summary
router.get('/summary', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [summary] = await db.promise().query(
            'SELECT SUM(amount_kg) as total_saved, COUNT(*) as activities FROM carbon_logs WHERE user_id = ?',
            [userId]
        );
        res.json(summary[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
