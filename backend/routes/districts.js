const express = require('express');
const db = require('../db');
const router = express.Router();

// Create district (admin only?)
router.post('/', async (req, res) => {
    const { name, code } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO districts (name, code) VALUES (?, ?)',
            [name, code]
        );
        res.status(201).json({ message: 'District created', districtId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all districts
router.get('/', async (req, res) => {
    try {
        const [districts] = await db.promise().query('SELECT * FROM districts');
        res.json(districts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
