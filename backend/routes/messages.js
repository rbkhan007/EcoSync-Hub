const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const io = require('../server').io; // Import io from server

const router = express.Router();

// Get conversations (list of conversations with latest message)
router.get('/conversations', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [conversations] = await db.query(
            `SELECT 
                c.id as conversation_id,
                c.is_group,
                u.id as other_user_id,
                u.username as other_username,
                u.profile_picture as other_profile_picture,
                m.content as last_message,
                m.created_at as last_message_time,
                m.sender_id as last_message_sender_id
             FROM conversations c
             JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
             LEFT JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != ?
             LEFT JOIN users u ON cp2.user_id = u.id
             LEFT JOIN unread_messages_count umc ON umc.conversation_id = c.id AND umc.user_id = ?
             LEFT JOIN LATERAL (
                SELECT content, created_at, sender_id 
                FROM messages 
                WHERE conversation_id = c.id 
                ORDER BY created_at DESC 
                LIMIT 1
             ) m ON true
             ORDER BY m.created_at DESC`,
            [userId, userId, userId]
        );
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get messages for a specific conversation
router.get('/:conversationId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        // Verify user is a participant
        const [participant] = await db.query(
            'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
        );
        if (participant.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [messages] = await db.query(
            `SELECT m.id, m.sender_id, m.content, m.created_at, m.message_type, m.attachment_url,
                u.username as sender_username, u.profile_picture as sender_profile_picture
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = ?
             ORDER BY m.created_at ASC`,
            [conversationId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send message
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { conversation_id, receiver_id, content, message_type = 'text', attachment_url } = req.body;

    if (!content && !attachment_url) {
        return res.status(400).json({ message: 'Content or attachment is required' });
    }

    try {
        let conversationId = conversation_id;

        // If no conversation_id, try to find or create one for 1-on-1 with receiver_id
        if (!conversationId && receiver_id) {
            const [existing] = await db.query(
                `SELECT cp1.conversation_id 
                 FROM conversation_participants cp1
                 JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
                 JOIN conversations c ON cp1.conversation_id = c.id
                 WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.is_group = FALSE`,
                [userId, receiver_id]
            );

            if (existing.length > 0) {
                conversationId = existing[0].conversation_id;
            } else {
                // Create new conversation
                const [convResult] = await db.query('INSERT INTO conversations (is_group) VALUES (FALSE)');
                conversationId = convResult.insertId;
                await db.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
                    [conversationId, userId, conversationId, receiver_id]);
            }
        }

        if (!conversationId) {
            return res.status(400).json({ message: 'Conversation or receiver ID required' });
        }

        const [result] = await db.query(
            'INSERT INTO messages (conversation_id, sender_id, content, message_type, attachment_url) VALUES (?, ?, ?, ?, ?)',
            [conversationId, userId, content, message_type, attachment_url || null]
        );

        const messageData = {
            id: result.insertId,
            conversation_id: conversationId,
            sender_id: userId,
            content,
            message_type,
            attachment_url,
            created_at: new Date()
        };

        // Emit to the conversation room via socket
        if (io) {
            io.to(`conversation:${conversationId}`).emit('new_message', messageData);
        }

        res.status(201).json({ message: 'Message sent', messageData });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark messages as read (Update last_read_message_id)
router.post('/mark-read', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { conversation_id } = req.body;

    if (!conversation_id) {
        return res.status(400).json({ message: 'conversation_id is required' });
    }

    try {
        // Get the latest message ID in the conversation
        const [latest] = await db.query('SELECT MAX(id) as max_id FROM messages WHERE conversation_id = ?', [conversation_id]);

        if (latest.length > 0 && latest[0].max_id) {
            await db.query(
                'UPDATE conversation_participants SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?',
                [latest[0].max_id, conversation_id, userId]
            );
        }
        res.json({ message: 'Conversation marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get total unread count across all conversations
router.get('/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [result] = await db.query(
            'SELECT SUM(unread_count) as total_unread FROM unread_messages_count WHERE user_id = ?',
            [userId]
        );
        res.json({ unread: result[0].total_unread || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'DELETE FROM messages WHERE id = ? AND sender_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found or unauthorized' });
        }
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
