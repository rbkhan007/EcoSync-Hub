const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all posts (with optional auth for isSaved/isLiked)
router.get('/posts', async (req, res) => {
    try {
        let userId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (e) { /* ignore invalid token */ }
        }

        const [posts] = await db.query(
            `SELECT p.id, p.content, p.media, p.created_at, p.impact_verified, p.eco_impact_type,
        u.username, u.profile_picture,
        p.total_reactions as likes,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) as isSaved,
        EXISTS(SELECT 1 FROM reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'like') as isLiked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.deleted_at IS NULL
       ORDER BY p.impact_verified DESC, p.created_at DESC`,
            [userId, userId]
        );
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Get personalized feed (Friends + Own posts)
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [posts] = await db.query(
            `SELECT p.id, p.content, p.media, p.created_at, p.impact_verified, p.eco_impact_type,
        u.username, u.profile_picture,
        p.total_reactions as likes,
        EXISTS(SELECT 1 FROM reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'like') as isLiked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) as isSaved
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.deleted_at IS NULL AND (
         p.user_id = ? 
         OR EXISTS (
           SELECT 1 FROM friendships f 
           WHERE f.status = 'accepted' 
           AND ((f.user_id = ? AND f.friend_id = p.user_id) OR (f.friend_id = ? AND f.user_id = p.user_id))
         )
       )
       ORDER BY p.impact_verified DESC, p.created_at DESC
       LIMIT 50`,
            [userId, userId, userId, userId, userId]
        );
        res.json(posts);
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Get aggregated feed from all user's groups
router.get('/groups-feed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [posts] = await db.query(
            `SELECT gp.*, 
                CASE WHEN gp.is_anonymous THEN gp.nickname ELSE u.username END as username,
                CASE WHEN gp.is_anonymous THEN NULL ELSE u.profile_picture END as profile_picture,
                g.name as group_name,
                g.cover_photo as group_image
            FROM group_posts gp
            JOIN users u ON gp.user_id = u.id
            JOIN groups g ON gp.group_id = g.id
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = ? AND gp.deleted_at IS NULL
            ORDER BY gp.created_at DESC
            LIMIT 50`,
            [userId]
        );
        res.json(posts);
    } catch (error) {
        console.error('Error fetching groups feed:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single post
router.get('/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [posts] = await db.query(
            `SELECT p.id, p.content, p.media, p.created_at,
        u.username, u.profile_picture,
        p.total_reactions as likes
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
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
    const { content, media, eco_impact_type } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO posts (user_id, content, media, eco_impact_type) VALUES (?, ?, ?, ?)',
            [userId, content, media ? JSON.stringify(media) : null, eco_impact_type || null]
        );
        const postId = result.insertId;

        // Hashtag Parsing Logic
        const hashtags = content.match(/#(\w+)/g);
        if (hashtags) {
            for (let tag of hashtags) {
                const tagName = tag.substring(1).toLowerCase();
                // Ensure tag exists
                await db.query('INSERT IGNORE INTO tags (name) VALUES (?)', [tagName]);
                const [tagRow] = await db.query('SELECT id FROM tags WHERE name = ?', [tagName]);
                if (tagRow.length > 0) {
                    await db.query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagRow[0].id]);
                }
            }
        }

        res.status(201).json({ message: 'Post created', postId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Trending Hashtags
router.get('/trending-tags', async (req, res) => {
    try {
        const [tags] = await db.query('SELECT * FROM trending_hashtags');
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Save/Unsave post
router.post('/posts/:id/save', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;
    try {
        const [existing] = await db.query('SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?', [userId, postId]);
        if (existing.length > 0) {
            await db.query('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?', [userId, postId]);
            res.json({ message: 'Post unsaved' });
        } else {
            await db.query('INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)', [userId, postId]);
            res.json({ message: 'Post saved' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's saved posts
router.get('/saved-posts', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [posts] = await db.query(
            `SELECT p.id, p.content, p.media, p.created_at, u.username, u.profile_picture
             FROM saved_posts sp
             JOIN posts p ON sp.post_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE sp.user_id = ? AND p.deleted_at IS NULL
             ORDER BY sp.created_at DESC`,
            [userId]
        );
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update post
router.put('/posts/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { content, media } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE posts SET content = ?, media = ? WHERE id = ? AND user_id = ?',
            [content, media ? JSON.stringify(media) : null, id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found or not authorized' });
        }
        res.json({ message: 'Post updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete post (Soft delete)
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'UPDATE posts SET deleted_at = NOW() WHERE id = ? AND user_id = ?',
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
        const [existing] = await db.query(
            "SELECT id FROM reactions WHERE user_id = ? AND post_id = ? AND reaction_type = 'like'",
            [userId, postId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query("DELETE FROM reactions WHERE user_id = ? AND post_id = ? AND reaction_type = 'like'", [userId, postId]);
            res.json({ message: 'Post unliked' });
        } else {
            // Like
            await db.query("INSERT INTO reactions (user_id, post_id, reaction_type) VALUES (?, ?, 'like')", [userId, postId]);
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
        const [posts] = await db.query(
            `SELECT p.id, p.content, p.media, p.created_at,
        p.total_reactions as likes
       FROM posts p
       WHERE p.user_id = ? AND p.deleted_at IS NULL
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
        const [comments] = await db.query(
            `SELECT c.*, u.username, u.profile_picture
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ? AND c.deleted_at IS NULL
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
        const [result] = await db.query(
            'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
            [userId, postId, content]
        );
        res.status(201).json({ message: 'Comment added', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete comment (Soft delete)
router.delete('/comments/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'UPDATE comments SET deleted_at = NOW() WHERE id = ? AND user_id = ?',
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
