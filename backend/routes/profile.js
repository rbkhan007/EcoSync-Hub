const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get own profile
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [users] = await db.query(
            'SELECT id, username, email, phone, role, bio, profile_picture, eco_points, carbon_saved_kg, trees_planted, full_name, display_name, gender, birth_date, district_id, upazila_id, streak_days, follower_count, following_count, friend_count, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update profile (partial)
router.patch('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { bio, profile_picture, full_name, display_name, gender, districtId, upazilaId, birth_date } = req.body;

    try {
        const updates = [];
        const params = [];
        if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
        if (profile_picture !== undefined) { updates.push('profile_picture = ?'); params.push(profile_picture); }
        if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
        if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
        if (gender !== undefined) { updates.push('gender = ?'); params.push(gender); }
        if (districtId !== undefined) { updates.push('district_id = ?'); params.push(districtId); }
        if (upazilaId !== undefined) { updates.push('upazila_id = ?'); params.push(upazilaId); }
        if (birth_date !== undefined) { updates.push('birth_date = ?'); params.push(birth_date); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        params.push(userId);
        const [result] = await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get public profile by username
router.get('/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const [users] = await db.query(
            'SELECT id, username, display_name, role, bio, profile_picture, eco_points, carbon_saved_kg, trees_planted, created_at, district_id, follower_count, following_count, friend_count FROM users WHERE username = ?',
            [username]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get personal eco-stats, streaks, badges
router.get('/my/eco-stats', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [stats] = await db.query(
            'SELECT eco_points, carbon_saved_kg, trees_planted, streak_days FROM users WHERE id = ?',
            [userId]
        );

        if (stats.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [badges] = await db.query(
            `SELECT b.name, b.description, b.icon_url, ub.awarded_at 
             FROM user_badges ub
             JOIN badges b ON ub.badge_id = b.id
             WHERE ub.user_id = ?`,
            [userId]
        );

        res.json({
            ...stats[0],
            badges
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update location specifically
router.patch('/location', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { districtId, upazilaId } = req.body;

    if (!districtId || !upazilaId) {
        return res.status(400).json({ message: 'District ID and upazila ID are required' });
    }

    try {
        await db.query(
            'UPDATE users SET district_id = ?, upazila_id = ? WHERE id = ?',
            [districtId, upazilaId, userId]
        );
        res.json({ message: 'Location updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Follow/Unfollow User
router.post('/:id/follow', authenticateToken, async (req, res) => {
    const followerId = req.user.id;
    const followingId = req.params.id;

    if (followerId == followingId) {
        return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    try {
        const [existing] = await db.query('SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
        if (existing.length > 0) {
            await db.query('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
            res.json({ message: 'Unfollowed successfully' });
        } else {
            await db.query('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId]);
            res.json({ message: 'Followed successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
