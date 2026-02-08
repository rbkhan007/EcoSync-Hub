const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.promise().query('SELECT * FROM categories');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [category] = await db.promise().query('SELECT * FROM categories WHERE id = ?', [id]);
        if (category.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create category (protected)
router.post('/', authenticateToken, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ message: 'Category created', categoryId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update category (protected)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const [result] = await db.promise().query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete category (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;