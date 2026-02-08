const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [notifications] = await db.promise().query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
