const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's carbon logs
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [logs] = await db.query(
            'SELECT * FROM carbon_logs WHERE user_id = ? ORDER BY logged_at DESC',
            [userId]
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Log carbon savings
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { amount_kg, action_type } = req.body;

    if (!amount_kg || !action_type) {
        return res.status(400).json({ message: 'Amount and action_type are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO carbon_logs (user_id, amount_kg, action_type) VALUES (?, ?, ?)',
            [userId, amount_kg, action_type]
        );
        res.status(201).json({ message: 'Carbon log added', logId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get carbon savings summary
router.get('/summary', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [summary] = await db.query(
            'SELECT SUM(amount_kg) as total_saved, COUNT(*) as activities FROM carbon_logs WHERE user_id = ?',
            [userId]
        );
        res.json(summary[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get AI-powered carbon reduction suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user's recent carbon logs to give context to the AI
        const [recentLogs] = await db.query(
            'SELECT * FROM carbon_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 5',
            [userId]
        );

        // Fetch user metadata for personalization
        const [userProfile] = await db.query(
            'SELECT carbon_saved_kg FROM users WHERE id = ?',
            [userId]
        );

        const carbonSaved = userProfile[0]?.carbon_saved_kg || 0;

        // Construct the prompt
        const prompt = `
            User has saved ${carbonSaved}kg of CO2. 
            Recent activities: ${recentLogs.map(l => `${l.action_type} (${l.amount_kg}kg)`).join(', ')}.
            Suggest 3 personalized, actionable ways this user can reduce their carbon footprint further.
            Format the response as a JSON array of objects with 'title' and 'description' keys.
        `;

        // Call AI API (Google Gemini or similar)
        // Note: In a real environment, you would use axios/fetch to call the API
        // For now, we will return a mock response if no API key is present, or try to call if defined.

        const aiResponse = [
            {
                title: "Switch to LED Bulbs",
                description: "Replacing 5 incandescent bulbs with LEDs can save up to 100kg CO2 per year."
            },
            {
                title: "Meat-Free Mondays",
                description: "Skipping meat one day a week can save roughly 200kg CO2 annually."
            },
            {
                title: "Unplug Electronics",
                description: "Unplugging devices when fully charged prevents 'vampire energy' loss."
            }
        ];

        // If you have an AI service, uncomment and implement:
        /*
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        if (process.env.GEMINI_API_KEY) {
             const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
             const model = genAI.getGenerativeModel({ model: "gemini-pro"});
             const result = await model.generateContent(prompt);
             const text = result.response.text();
             // Parse JSON from text...
        }
        */

        res.json(aiResponse);

    } catch (error) {
        console.error("AI Guidelines Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get local carbon stats
router.get('/local/:districtId', async (req, res) => {
    const { districtId } = req.params;
    try {
        const [stats] = await db.query(`
            SELECT 
                SUM(cl.amount_kg) as total_saved,
                COUNT(cl.id) as total_activities,
                COUNT(DISTINCT cl.user_id) as participant_count
            FROM carbon_logs cl
            JOIN users u ON cl.user_id = u.id
            WHERE u.district_id = ?
        `, [districtId]);
        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get national carbon stats
router.get('/national', async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                SUM(amount_kg) as total_saved,
                COUNT(id) as total_activities,
                COUNT(DISTINCT user_id) as participant_count
            FROM carbon_logs
        `);
        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// National leaderboard
router.get('/leaderboard/national', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT id, username, profile_picture, carbon_saved_kg, eco_points, streak_days
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY carbon_saved_kg DESC
            LIMIT 50
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// District leaderboard
router.get('/leaderboard/district/:districtId', async (req, res) => {
    const { districtId } = req.params;
    try {
        const [users] = await db.query(`
            SELECT id, username, profile_picture, carbon_saved_kg, eco_points, streak_days
            FROM users
            WHERE district_id = ? AND deleted_at IS NULL
            ORDER BY carbon_saved_kg DESC
            LIMIT 50
        `, [districtId]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
