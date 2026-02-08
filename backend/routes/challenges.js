const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all challenges
router.get('/', async (req, res) => {
    try {
        const [challenges] = await db.promise().query('SELECT * FROM challenges ORDER BY created_at DESC');
        res.json(challenges);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get challenge by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [challenge] = await db.promise().query('SELECT * FROM challenges WHERE id = ?', [id]);
        if (challenge.length === 0) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json(challenge[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create challenge (admin only)
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, points_reward, co2_saving_kg, duration_days, image_url, category } = req.body;

    if (!title || !points_reward || !duration_days) {
        return res.status(400).json({ message: 'Title, points_reward, and duration_days are required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO challenges (title, description, points_reward, co2_saving_kg, duration_days, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description || '', points_reward, co2_saving_kg || 0.00, duration_days, image_url || '', category || 'Week']
        );
        res.status(201).json({ message: 'Challenge created', challengeId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update challenge (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, points_reward, co2_saving_kg, duration_days, image_url, category } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE challenges SET title = ?, description = ?, points_reward = ?, co2_saving_kg = ?, duration_days = ?, image_url = ?, category = ? WHERE id = ?',
            [title, description || '', points_reward || 0, co2_saving_kg || 0.00, duration_days || 7, image_url || '', category || 'Week', id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json({ message: 'Challenge updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete challenge (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    try {
        const [result] = await db.promise().query('DELETE FROM challenges WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json({ message: 'Challenge deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's challenges
router.get('/user/me', authenticateToken, async (req, res) => {
    try {
        const [userChallenges] = await db.promise().query(
            `SELECT uc.*, c.title, c.description, c.points_reward, c.co2_saving_kg, c.duration_days, c.category
             FROM user_challenges uc
             JOIN challenges c ON uc.challenge_id = c.id
             WHERE uc.user_id = ?
             ORDER BY uc.joined_at DESC`,
            [req.user.id]
        );
        res.json(userChallenges);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Join a challenge
router.post('/join/:challengeId', authenticateToken, async (req, res) => {
    const { challengeId } = req.params;
    const userId = req.user.id;

    try {
        // Check if already joined
        const [existing] = await db.promise().query(
            'SELECT id FROM user_challenges WHERE user_id = ? AND challenge_id = ?',
            [userId, challengeId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already joined this challenge' });
        }

        // Insert join record
        const [result] = await db.promise().query(
            'INSERT INTO user_challenges (user_id, challenge_id) VALUES (?, ?)',
            [userId, challengeId]
        );

        // Add notification for the user
        const [notifResult] = await db.promise().query(
            'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'Challenge Joined', 'You have successfully joined a new challenge!', 'challenge', challengeId, 'challenge']
        );

        // Real-time sync
        const io = require('../server').io;
        if (io) {
            io.to(userId).emit('new_notification', {
                id: notifResult.insertId,
                title: 'Challenge Joined',
                message: 'You have successfully joined a new challenge!',
                type: 'challenge',
                created_at: new Date()
            });
        }

        res.status(201).json({ message: 'Joined challenge', userChallengeId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update progress (user can update their own progress)
router.put('/progress/:userChallengeId', authenticateToken, async (req, res) => {
    const { userChallengeId } = req.params;
    const { progress } = req.body; // 0-100

    if (progress < 0 || progress > 100) {
        return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    try {
        // Ensure user owns this user_challenge
        const [uc] = await db.promise().query('SELECT user_id FROM user_challenges WHERE id = ?', [userChallengeId]);
        if (uc.length === 0) {
            return res.status(404).json({ message: 'User challenge not found' });
        }
        if (uc[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [result] = await db.promise().query(
            'UPDATE user_challenges SET progress = ? WHERE id = ?',
            [progress, userChallengeId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User challenge not found' });
        }
        res.json({ message: 'Progress updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Complete challenge
router.put('/complete/:userChallengeId', authenticateToken, async (req, res) => {
    const { userChallengeId } = req.params;

    try {
        // Ensure user owns this user_challenge
        const [uc] = await db.promise().query('SELECT user_id, status FROM user_challenges WHERE id = ?', [userChallengeId]);
        if (uc.length === 0) {
            return res.status(404).json({ message: 'User challenge not found' });
        }
        if (uc[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (uc[0].status === 'completed') {
            return res.status(400).json({ message: 'Challenge already completed' });
        }

        // Fetch challenge details to credit user
        const [challengeInfo] = await db.promise().query(
            `SELECT c.points_reward, c.co2_saving_kg, c.title 
             FROM user_challenges uc 
             JOIN challenges c ON uc.challenge_id = c.id 
             WHERE uc.id = ?`,
            [userChallengeId]
        );

        if (challengeInfo.length === 0) {
            return res.status(500).json({ message: 'Challenge metadata missing' });
        }

        const { points_reward, co2_saving_kg, title } = challengeInfo[0];
        const userId = uc[0].user_id;

        // Credit user points and carbon and trees if applicable
        const isTreeChallenge = title.toLowerCase().includes('tree');
        const treesToPlant = isTreeChallenge ? 1 : 0;

        // Perform updates
        await db.promise().query(
            'UPDATE user_challenges SET status = \'completed\', completed_at = NOW() WHERE id = ?',
            [userChallengeId]
        );

        await db.promise().query(
            'UPDATE users SET eco_points = eco_points + ?, carbon_saved_kg = carbon_saved_kg + ?, trees_planted = trees_planted + ? WHERE id = ?',
            [points_reward || 0, co2_saving_kg || 0, treesToPlant, userId]
        );

        // Log carbon activity
        await db.promise().query(
            'INSERT INTO carbon_logs (user_id, amount_kg, source) VALUES (?, ?, ?)',
            [userId, co2_saving_kg || 0, `Completed: ${title}`]
        );

        // Add notification for completion
        const [notifResult] = await db.promise().query(
            'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'Challenge Completed!', `Congratulations! You saved ${co2_saving_kg}kg CO2 and earned ${points_reward} points.`, 'challenge', userChallengeId, 'challenge_completion']
        );

        // Real-time sync
        const io = require('../server').io;
        if (io) {
            io.to(userId).emit('new_notification', {
                id: notifResult.insertId,
                title: 'Challenge Completed!',
                message: `Congratulations! You saved ${co2_saving_kg}kg CO2 and earned ${points_reward} points.`,
                type: 'challenge',
                created_at: new Date()
            });
        }

        res.json({ message: 'Challenge completed' });
    } catch (error) {
        console.error(`[Challenges] Error completing challenge:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;