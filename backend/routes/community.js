const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const [posts] = await db.promise().query(
            `SELECT p.id, p.content, p.image_url, p.created_at,
        u.username, u.avatar_url,
        COUNT(pl.id) as likes
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       GROUP BY p.id, u.username, u.avatar_url
       ORDER BY p.created_at DESC`
        );
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single post
router.get('/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [posts] = await db.promise().query(
            `SELECT p.id, p.content, p.image_url, p.created_at,
        u.username, u.avatar_url,
        COUNT(pl.id) as likes
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       WHERE p.id = ?
       GROUP BY p.id, u.username, u.avatar_url`,
            [id]
        );
        if (posts.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(posts[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create post
router.post('/posts', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { content, image_url } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
            [userId, content, image_url]
        );
        res.status(201).json({ message: 'Post created', postId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update post
router.put('/posts/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { content, image_url } = req.body;

    try {
        const [result] = await db.promise().query(
            'UPDATE posts SET content = ?, image_url = ? WHERE id = ? AND user_id = ?',
            [content, image_url, id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found or not authorized' });
        }
        res.json({ message: 'Post updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete post
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.promise().query(
            'DELETE FROM posts WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found or not authorized' });
        }
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Like/Unlike post
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id: postId } = req.params;

    try {
        // Check if already liked
        const [existing] = await db.promise().query(
            'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.promise().query('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
            res.json({ message: 'Post unliked' });
        } else {
            // Like
            await db.promise().query('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
            res.json({ message: 'Post liked' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's posts
router.get('/my-posts', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [posts] = await db.promise().query(
            `SELECT p.id, p.content, p.image_url, p.created_at,
        COUNT(pl.id) as likes
       FROM posts p
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
            [userId]
        );
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req, res) => {
    const { id: postId } = req.params;
    try {
        const [comments] = await db.promise().query(
            `SELECT c.*, u.username, u.avatar_url
             FROM post_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add comment to post
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id: postId } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO post_comments (user_id, post_id, content) VALUES (?, ?, ?)',
            [userId, postId, content]
        );
        res.status(201).json({ message: 'Comment added', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete comment
router.delete('/comments/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.promise().query(
            'DELETE FROM post_comments WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comment not found or not authorized' });
        }

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;