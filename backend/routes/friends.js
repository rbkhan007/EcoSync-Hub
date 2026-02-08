const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get friends list
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [friends] = await db.promise().query(
            `SELECT u.id, u.username, u.avatar_url, f.status, f.created_at
             FROM friends f
             JOIN users u ON (CASE WHEN f.user_id_1 = ? THEN f.user_id_2 = u.id ELSE f.user_id_1 = u.id END)
             WHERE (f.user_id_1 = ? OR f.user_id_2 = ?) AND f.status = 'accepted'`,
            [userId, userId, userId]
        );
        res.json(friends);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending friend requests
router.get('/requests', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [requests] = await db.promise().query(
            `SELECT u.id, u.username, u.avatar_url, f.id as request_id, f.created_at
             FROM friends f
             JOIN users u ON f.action_user_id = u.id
             WHERE (f.user_id_1 = ? OR f.user_id_2 = ?) AND f.action_user_id != ? AND f.status = 'pending'`,
            [userId, userId, userId]
        );
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send friend request
router.post('/request', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { friend_id } = req.body;

    if (userId == friend_id) {
        return res.status(400).json({ message: 'You cannot add yourself' });
    }

    const [user1, user2] = [userId, friend_id].sort((a, b) => a - b);

    try {
        // Check if relationship already exists
        const [existing] = await db.promise().query(
            'SELECT * FROM friends WHERE user_id_1 = ? AND user_id_2 = ?',
            [user1, user2]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Relationship already exists' });
        }

        await db.promise().query(
            'INSERT INTO friends (user_id_1, user_id_2, status, action_user_id) VALUES (?, ?, ?, ?)',
            [user1, user2, 'pending', userId]
        );

        // Add notification for the receiver
        const [notifResult] = await db.promise().query(
            'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
            [friend_id, 'New Friend Request', `${req.user.username} sent you a friend request`, 'friend', userId, 'friend_request']
        );

        // Real-time sync
        const io = require('../server').io;
        if (io) {
            io.to(friend_id).emit('new_notification', {
                id: notifResult.insertId,
                title: 'New Friend Request',
                message: `${req.user.username} sent you a friend request`,
                type: 'friend',
                created_at: new Date()
            });
        }

        res.status(201).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Accept friend request
router.post('/accept/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params; // Relationship ID

    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM friends WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const friendRequest = rows[0];
        if (friendRequest.action_user_id === userId) {
            return res.status(400).json({ message: 'You cannot accept your own request' });
        }

        const isUserInvolved = friendRequest.user_id_1 === userId || friendRequest.user_id_2 === userId;
        if (!isUserInvolved) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await db.promise().query(
            'UPDATE friends SET status = ?, action_user_id = ? WHERE id = ?',
            ['accepted', userId, id]
        );

        // Notify the requester
        const requesterId = friendRequest.action_user_id;
        const [notifResult] = await db.promise().query(
            'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
            [requesterId, 'Friend Request Accepted', `${req.user.username} accepted your friend request`, 'friend', id, 'friend_acceptance']
        );

        // Real-time sync
        const io = require('../server').io;
        if (io) {
            io.to(requesterId).emit('new_notification', {
                id: notifResult.insertId,
                title: 'Friend Request Accepted',
                message: `${req.user.username} accepted your friend request`,
                type: 'friend',
                created_at: new Date()
            });
        }

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
