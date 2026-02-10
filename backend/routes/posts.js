const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/**
 * Posts with Likes and Comments (Facebook-like Social Feed)
 */

// Get feed (all posts with pagination)
router.get('/feed', authenticateToken, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const [posts] = await db.query(`
            SELECT 
                p.id,
                p.user_id,
                p.content,
                p.media,
                p.post_type,
                p.visibility,
                p.created_at,
                p.impact_verified,
                p.eco_impact_type,
                u.username,
                u.display_name,
                u.profile_picture,
                p.location_district_id,
                p.total_reactions as likes_count,
                p.total_comments as comments_count,
                EXISTS(SELECT 1 FROM reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'like') as liked_by_user
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.deleted_at IS NULL
            GROUP BY p.id, u.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.user.id, parseInt(limit), offset]);

        const [total] = await db.query('SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL');

        res.json({
            posts,
            pagination: {
                total: total[0].count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total[0].count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get local feed by district ID
router.get('/feed/local/:districtId', authenticateToken, async (req, res) => {
    const { districtId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const [posts] = await db.query(`
            SELECT 
                p.id, p.content, p.media, p.post_type, p.created_at, p.impact_verified, p.eco_impact_type,
                u.username, u.display_name, u.profile_picture, p.location_district_id
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.location_district_id = ? AND p.deleted_at IS NULL
            ORDER BY p.impact_verified DESC, p.created_at DESC
            LIMIT ? OFFSET ?
        `, [districtId, parseInt(limit), offset]);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get trending posts
router.get('/feed/trending', authenticateToken, async (req, res) => {
    try {
        const [posts] = await db.query(`
            SELECT 
                p.id, p.content, p.media, p.post_type, p.created_at, p.impact_verified, p.eco_impact_type,
                u.username, u.display_name, u.profile_picture,
                p.total_reactions as likes_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.created_at > NOW() - INTERVAL '7 days' AND p.deleted_at IS NULL
            ORDER BY p.total_reactions DESC, p.created_at DESC
            LIMIT 20
        `);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const [posts] = await db.query(`
            SELECT 
                p.id,
                p.user_id,
                p.content,
                p.media,
                p.post_type,
                p.created_at,
                u.username,
                u.display_name,
                u.profile_picture,
                p.total_reactions as likes_count,
                p.total_comments as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ? AND p.deleted_at IS NULL
            GROUP BY p.id, u.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), offset]);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a post
router.post('/', authenticateToken, async (req, res) => {
    const { content, media, post_type, visibility, location_district_id, eco_impact_type, eco_points_boost } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Post content cannot be empty' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO posts (user_id, content, media, post_type, visibility, location_district_id, eco_impact_type, eco_points_boost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, content, media ? JSON.stringify(media) : null, post_type || 'text', visibility || 'public', location_district_id || null, eco_impact_type || null, eco_points_boost || 0]
        );

        res.status(201).json({ message: 'Post created', postId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get post details with comments
router.get('/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const [posts] = await db.query(`
            SELECT 
                p.id,
                p.user_id,
                p.content,
                p.media,
                p.post_type,
                p.created_at,
                u.username,
                u.display_name,
                u.profile_picture,
                p.total_reactions as likes_count,
                p.total_comments as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ? AND p.deleted_at IS NULL
            GROUP BY p.id, u.id
        `, [postId]);

        if (posts.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const [comments] = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                c.content,
                c.created_at,
                u.username,
                u.display_name,
                u.profile_picture
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.deleted_at IS NULL
            ORDER BY c.created_at DESC
        `, [postId]);

        res.json({ post: posts[0], comments });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a post (Soft delete)
router.delete('/:postId', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (posts.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (posts[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await db.query('UPDATE posts SET deleted_at = NOW() WHERE id = ?', [postId]);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST LIKES
 */

// Like a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // Check if already reacted with 'like'
        const [existing] = await db.query(
            'SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND reaction_type = \'like\'',
            [postId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already liked' });
        }

        await db.query(
            'INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, \'like\')',
            [postId, userId]
        );

        res.json({ message: 'Post liked' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Unlike a post
router.delete('/:postId/like', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        await db.query(
            'DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND reaction_type = \'like\'',
            [postId, userId]
        );

        res.json({ message: 'Post unliked' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST COMMENTS
 */

// Add comment to post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );

        res.status(201).json({ message: 'Comment added', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get comments on a post
router.get('/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const [comments] = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                c.content,
                c.created_at,
                u.username,
                u.display_name,
                u.profile_picture
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.deleted_at IS NULL
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [postId, parseInt(limit), offset]);

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete comment (Soft delete)
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    try {
        const [comments] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);

        if (comments.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comments[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await db.query('UPDATE comments SET deleted_at = NOW() WHERE id = ?', [commentId]);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
