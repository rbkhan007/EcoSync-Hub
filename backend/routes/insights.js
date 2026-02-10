const express = require('express');
const db = require('../db');

const router = express.Router();

// Transport insights (aggregated walking/cycling vs vehicles)
router.get('/transport', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT action_type as source, SUM(amount_kg) as saved_co2, COUNT(*) as activity_count
            FROM carbon_logs
            WHERE action_type LIKE '%walking%' OR action_type LIKE '%cycling%' OR action_type LIKE '%transport%'
            GROUP BY action_type
        `);
        res.json({
            title: 'Sustainable Transport Trends',
            description: 'Aggregated data on CO2 savings from walking, cycling, and public transport.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Plastic use insights
router.get('/plastic-use', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT action_type as source, SUM(amount_kg) as saved_co2, COUNT(*) as activity_count
            FROM carbon_logs
            WHERE action_type LIKE '%plastic%' OR action_type LIKE '%bag%' OR action_type LIKE '%waste%'
            GROUP BY action_type
        `);
        res.json({
            title: 'Plastic Reduction Impact',
            description: 'Impact of plastic reduction activities on the environment.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Energy saving insights
router.get('/energy', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT action_type as source, SUM(amount_kg) as saved_co2, COUNT(*) as activity_count
            FROM carbon_logs
            WHERE action_type LIKE '%energy%' OR action_type LIKE '%light%' OR action_type LIKE '%solar%'
            GROUP BY action_type
        `);
        res.json({
            title: 'Energy Conservation Trends',
            description: 'Aggregated energy saving data from the community.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Food waste insights
router.get('/food-waste', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT action_type as source, SUM(amount_kg) as saved_co2, COUNT(*) as activity_count
            FROM carbon_logs
            WHERE action_type LIKE '%food%' OR action_type LIKE '%compost%' OR action_type LIKE '%waste%'
            GROUP BY action_type
        `);
        res.json({
            title: 'Food Waste Management',
            description: 'Insights into food waste reduction and composting efforts.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Challenge participation insights
router.get('/challenges/participation', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT c.title, COUNT(uc.id) as participation_count, 
                   SUM(CASE WHEN uc.status = 'completed' THEN 1 ELSE 0 END) as completion_count
            FROM challenges c
            LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
            GROUP BY c.id
        `);
        res.json({
            title: 'Eco-Challenge Engagement',
            description: 'Community participation and completion rates for sustainability challenges.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Youth eco-awareness
router.get('/youth-eco-awareness', async (req, res) => {
    try {
        // Signups in last 90 days aggregated by district
        const [results] = await db.query(`
            SELECT d.name as district, COUNT(u.id) as signups
            FROM users u
            JOIN districts d ON u.district_id = d.id
            WHERE u.created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY d.name
        `);
        res.json({
            title: 'Youth Eco-Awareness Growth',
            description: 'Growth in platform adoption across various districts in the last 90 days.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Tree planting heat map data
router.get('/tree-planting', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT d.name as district, SUM(u.trees_planted) as total_trees
            FROM users u
            JOIN districts d ON u.district_id = d.id
            WHERE u.trees_planted > 0
            GROUP BY d.name
        `);
        res.json({
            title: 'Tree Planting Heat Map',
            description: 'Total trees planted per district.',
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
