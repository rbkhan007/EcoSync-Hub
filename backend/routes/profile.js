const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [users] = await db.promise().query(
            'SELECT id, username, email, role, bio, avatar_url, eco_points, carbon_saved_kg, trees_planted, first_name, last_name, birth_date, gender, created_at FROM users WHERE id = ?',
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

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { bio, avatar_url, firstName, lastName, birthDate, gender } = req.body;

    try {
        const [result] = await db.promise().query(
            'UPDATE users SET bio = ?, avatar_url = ?, first_name = ?, last_name = ?, birth_date = ?, gender = ? WHERE id = ?',
            [bio, avatar_url, firstName, lastName, birthDate, gender, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



module.exports = router;