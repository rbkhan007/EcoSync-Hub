const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const io = require('../server').io; // Import io from server

const router = express.Router();

// Get conversations (list of users with latest message)
router.get('/conversations', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [conversations] = await db.promise().query(
            `SELECT
        CASE
          WHEN m.sender_id = ? THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        u.username, u.avatar_url,
        m.sender_id as last_message_sender_id,
        m.content as last_message,
        m.created_at as last_message_time,
        m.is_read
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      INNER JOIN (
        SELECT
          CASE
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END as other_id,
          MAX(created_at) as latest_time
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY other_id
      ) latest ON (
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END = latest.other_id
        AND m.created_at = latest.latest_time
      )`,
            [userId, userId, userId, userId, userId, userId]
        );
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get messages with a specific user
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { with: otherUserId } = req.query;

    if (!otherUserId) {
        return res.status(400).json({ message: 'Specify user to get messages with' });
    }

    try {
        const [messages] = await db.promise().query(
            `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
        u.username as sender_username
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
            [userId, otherUserId, otherUserId, userId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send message
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [userId, receiver_id, content]
        );

        const message = {
            id: result.insertId,
            sender_id: userId,
            receiver_id,
            content,
            is_read: false,
            created_at: new Date()
        };

        // Emit to receiver via socket
        io.to(receiver_id).emit('new_message', message);

        res.status(201).json({ message: 'Message sent', messageId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark messages as read
router.post('/mark-read', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { with: otherUserId } = req.body;

    if (!otherUserId) {
        return res.status(400).json({ message: 'Specify user to mark messages as read' });
    }

    try {
        await db.promise().query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [otherUserId, userId]
        );
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [result] = await db.promise().query(
            'SELECT COUNT(*) as unread FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );
        res.json({ unread: result[0].unread });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.promise().query(
            'DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
            [id, userId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;