const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// ===================================================================
// STORIES ENDPOINTS
// ===================================================================

// Get all active stories for the user's friends
router.get('/stories', auth, async (req, res) => {
    try {
        const [stories] = await db.query(
            `SELECT s.*, u.id AS user_id, u.username, u.profile_picture, u.display_name,
              s.views_count,
              EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_id = ?) AS is_viewed
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at > NOW() AND s.deleted_at IS NULL
            AND (s.user_id IN (SELECT friend_id FROM friendships WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = 'accepted')
                 OR s.user_id = ?)
            GROUP BY s.id, u.id
            ORDER BY s.created_at DESC
            LIMIT 50`,
            [req.user.id, req.user.id, req.user.id, req.user.id]
        );
        res.json(stories);
    } catch (err) {
        console.error('Error fetching stories:', err);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});

// Create a story
router.post('/stories', auth, async (req, res) => {
    try {
        const { media_url, media_type, caption, background_color, text_color } = req.body;

        const [result] = await db.query(
            `INSERT INTO stories (user_id, media_url, media_type, caption, background_color, text_color, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
            [req.user.id, media_url, media_type, caption, background_color, text_color]
        );

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error('Error creating story:', err);
        res.status(500).json({ error: 'Failed to create story' });
    }
});

// Mark story as viewed
router.post('/stories/:storyId/view', auth, async (req, res) => {
    try {
        await db.query(
            `INSERT INTO story_views (story_id, viewer_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE viewed_at = NOW()`,
            [req.params.storyId, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error marking story as viewed:', err);
        res.status(500).json({ error: 'Failed to mark story as viewed' });
    }
});

// ===================================================================
// REACTIONS ENDPOINTS
// ===================================================================

// Add or update reaction
router.post('/reactions', auth, async (req, res) => {
    try {
        const { post_id, story_id, reel_id, comment_id, reaction_type } = req.body;

        const [result] = await db.query(
            `INSERT INTO reactions (user_id, post_id, story_id, reel_id, comment_id, reaction_type)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type), created_at = NOW()`,
            [req.user.id, post_id || null, story_id || null, reel_id || null, comment_id || null, reaction_type]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error adding reaction:', err);
        res.status(500).json({ error: 'Failed to add reaction' });
    }
});

// Get reactions for a post
router.get('/reactions/post/:postId', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT reaction_type, COUNT(*) as count
       FROM reactions
       WHERE post_id = ?
       GROUP BY reaction_type`,
            [req.params.postId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching reactions:', err);
        res.status(500).json({ error: 'Failed to fetch reactions' });
    }
});

// Remove reaction
router.delete('/reactions', auth, async (req, res) => {
    try {
        const { post_id, story_id, comment_id } = req.body;

        await db.query(
            `DELETE FROM reactions
       WHERE user_id = ? AND post_id = ? AND story_id = ? AND comment_id = ?`,
            [req.user.id, post_id || null, story_id || null, comment_id || null]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error removing reaction:', err);
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
});

// ===================================================================
// REELS ENDPOINTS
// ===================================================================

// Get trending reels
router.get('/reels', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = 10;

        const [reels] = await db.query(
            `SELECT r.*, u.username, u.profile_picture, r.likes_count, r.views_count
             FROM reels r
             JOIN users u ON r.user_id = u.id
             WHERE r.is_published = TRUE AND r.deleted_at IS NULL
             ORDER BY r.views_count DESC, r.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, page * limit]
        );

        res.json(reels);
    } catch (err) {
        console.error('Error fetching reels:', err);
        res.status(500).json({ error: 'Failed to fetch reels' });
    }
});

// Alias for discover reels
router.get('/reels/discover', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = 10;

        const [reels] = await db.query(
            `SELECT r.*, u.username, u.profile_picture, r.likes_count
             FROM reels r
             JOIN users u ON r.user_id = u.id
             WHERE r.is_published = TRUE AND r.deleted_at IS NULL
             ORDER BY RAND()
             LIMIT ? OFFSET ?`,
            [limit, page * limit]
        );

        res.json(reels);
    } catch (err) {
        console.error('Error fetching discover reels:', err);
        res.status(500).json({ error: 'Failed to fetch discover reels' });
    }
});

// Create a reel
router.post('/reels', auth, async (req, res) => {
    try {
        const { video_url, thumbnail_url, caption, duration } = req.body;

        const [result] = await db.query(
            `INSERT INTO reels (user_id, video_url, thumbnail_url, caption, duration)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, video_url, thumbnail_url, caption, duration]
        );

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error('Error creating reel:', err);
        res.status(500).json({ error: 'Failed to create reel' });
    }
});

// Like a reel
router.post('/reels/:reelId/like', auth, async (req, res) => {
    try {
        await db.query(
            `INSERT INTO reel_likes (reel_id, user_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE liked_at = NOW()`,
            [req.params.reelId, req.user.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error liking reel:', err);
        res.status(500).json({ error: 'Failed to like reel' });
    }
});

// ===================================================================
// GROUPS ENDPOINTS
// ===================================================================

// Get all groups
router.get('/groups', auth, async (req, res) => {
    try {
        const [groups] = await db.query(
            `SELECT g.*, u.username as creator_name, u.profile_picture,
              CASE WHEN EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?)
                THEN true ELSE false END AS is_member
            FROM groups g
            JOIN users u ON g.creator_id = u.id
            WHERE g.is_active = TRUE
            AND (g.privacy = 'public' 
                 OR g.creator_id = ?
                 OR g.id IN (SELECT group_id FROM group_members WHERE user_id = ?))
            ORDER BY g.member_count DESC
            LIMIT 50`,
            [req.user.id, req.user.id, req.user.id]
        );

        res.json(groups);
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// Create a group
router.post('/groups', auth, async (req, res) => {
    try {
        const { name, description, cover_photo, privacy, category } = req.body;

        const [result] = await db.query(
            `INSERT INTO groups (creator_id, name, description, cover_photo, privacy, category, member_count)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [req.user.id, name, description, cover_photo, privacy, category]
        );

        const groupId = result.insertId;

        // Add creator as admin
        await db.query(
            `INSERT INTO group_members (group_id, user_id, member_role) VALUES (?, ?, 'admin')`,
            [groupId, req.user.id]
        );

        res.status(201).json({ id: groupId, name, description });
    } catch (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Join a group
router.post('/groups/:groupId/join', auth, async (req, res) => {
    try {
        await db.query(
            `INSERT INTO group_members (group_id, user_id, member_role)
             VALUES (?, ?, 'member')
             ON DUPLICATE KEY UPDATE member_role = 'member'`,
            [req.params.groupId, req.user.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error joining group:', err);
        res.status(500).json({ error: 'Failed to join group' });
    }
});

// Get group posts
router.get('/groups/:groupId/posts', auth, async (req, res) => {
    try {
        const [posts] = await db.query(
            `SELECT gp.*, 
              CASE WHEN gp.is_anonymous THEN gp.nickname ELSE u.username END as username,
              CASE WHEN gp.is_anonymous THEN NULL ELSE u.profile_picture END as profile_picture,
              gp.is_anonymous,
              gp.total_reactions
            FROM group_posts gp
            JOIN users u ON gp.user_id = u.id
            WHERE gp.group_id = ? AND gp.deleted_at IS NULL
            ORDER BY gp.is_pinned DESC, gp.created_at DESC`,
            [req.params.groupId]
        );

        res.json(posts);
    } catch (err) {
        console.error('Error fetching group posts:', err);
        res.status(500).json({ error: 'Failed to fetch group posts' });
    }
});

// Create a group post
router.post('/groups/:groupId/posts', auth, async (req, res) => {
    try {
        const { content, media, is_anonymous, nickname } = req.body;

        const [result] = await db.query(
            `INSERT INTO group_posts (group_id, user_id, content, media, is_anonymous, nickname)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.groupId, req.user.id, content, media ? JSON.stringify(media) : null, is_anonymous || false, nickname || null]
        );

        res.status(201).json({ id: result.insertId, content });
    } catch (err) {
        console.error('Error creating group post:', err);
        res.status(500).json({ error: 'Failed to create group post' });
    }
});

// ===================================================================
// EVENTS ENDPOINTS
// ===================================================================

// Get upcoming events
router.get('/events', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT e.*, u.username as creator_name, u.profile_picture,
              g.name as group_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN groups g ON e.group_id = g.id
       WHERE e.start_date >= NOW() AND e.is_cancelled = FALSE
       ORDER BY e.start_date ASC
       LIMIT 50`
        );

        res.json(rows);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create an event
router.post('/events', auth, async (req, res) => {
    try {
        const { title, description, event_image, location, start_date, end_date, event_type, max_attendees, group_id } = req.body;

        const [result] = await db.query(
            `INSERT INTO events (creator_id, group_id, title, description, event_image, location, start_date, end_date, event_type, max_attendees)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, group_id || null, title, description, event_image, location, start_date, end_date, event_type, max_attendees]
        );

        res.status(201).json({ id: result.insertId, title });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// RSVP to an event
router.post('/events/:eventId/rsvp', auth, async (req, res) => {
    try {
        const { attendance_status } = req.body;

        await db.query(
            `INSERT INTO event_attendees (event_id, user_id, attendance_status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE attendance_status = VALUES(attendance_status)`,
            [req.params.eventId, req.user.id, attendance_status]
        );

        // Update counters
        await db.query(
            `UPDATE events SET 
        total_going = (SELECT COUNT(*) FROM event_attendees WHERE event_id = ? AND attendance_status = 'going'),
        total_interested = (SELECT COUNT(*) FROM event_attendees WHERE event_id = ? AND attendance_status = 'interested')
       WHERE id = ?`,
            [req.params.eventId, req.params.eventId, req.params.eventId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error RSVPing to event:', err);
        res.status(500).json({ error: 'Failed to RSVP to event' });
    }
});

// ===================================================================
// TAGGING ENDPOINTS
// ===================================================================

// Tag a user in a post
router.post('/tags', auth, async (req, res) => {
    try {
        const { post_id, comment_id, reel_id, tagged_user_id } = req.body;

        const [result] = await db.query(
            `INSERT INTO user_tags (post_id, comment_id, reel_id, tagged_user_id, tagger_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE created_at = NOW()`,
            [post_id || null, comment_id || null, reel_id || null, tagged_user_id, req.user.id]
        );

        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('Error creating tag:', err);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

// ===================================================================
// LIVE STREAMS ENDPOINTS
// ===================================================================

// Start a live stream
router.post('/live-streams', auth, async (req, res) => {
    try {
        const { title, description, group_id } = req.body;

        const [result] = await db.query(
            `INSERT INTO live_streams (user_id, group_id, title, description, status, started_at)
       VALUES (?, ?, ?, ?, 'live', NOW())`,
            [req.user.id, group_id || null, title, description]
        );
        res.status(201).json({ id: result.insertId, title });
    } catch (err) {
        console.error('Error starting live stream:', err);
        res.status(500).json({ error: 'Failed to start live stream' });
    }
});

// End a live stream
router.post('/live-streams/:streamId/end', auth, async (req, res) => {
    try {
        await db.query(
            `UPDATE live_streams SET status = 'ended', ended_at = NOW()
       WHERE id = ? AND user_id = ?`,
            [req.params.streamId, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error ending live stream:', err);
        res.status(500).json({ error: 'Failed to end live stream' });
    }
});

// Get live streams
router.get('/live-streams', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ls.*, u.username, u.profile_picture, COUNT(DISTINCT lsc.id) as comment_count
       FROM live_streams ls
       JOIN users u ON ls.user_id = u.id
       LEFT JOIN live_stream_comments lsc ON ls.id = lsc.live_stream_id
       WHERE ls.status IN ('live', 'ended')
       GROUP BY ls.id, u.id
       ORDER BY ls.status = 'live' DESC, ls.started_at DESC
       LIMIT 50`
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching live streams:', err);
        res.status(500).json({ error: 'Failed to fetch live streams' });
    }
});

// ===================================================================
// SHARES ENDPOINTS
// ===================================================================

// Share a post
router.post('/shares', auth, async (req, res) => {
    try {
        const { original_post_id, original_reel_id, shared_to_user_id, shared_to_group_id, share_message } = req.body;

        const [result] = await db.query(
            `INSERT INTO shares (original_post_id, original_reel_id, shared_by_user_id, shared_to_user_id, shared_to_group_id, share_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [original_post_id || null, original_reel_id || null, req.user.id, shared_to_user_id || null, shared_to_group_id || null, share_message]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('Error sharing post:', err);
        res.status(500).json({ error: 'Failed to share post' });
    }
});

module.exports = router;
