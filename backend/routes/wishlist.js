const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [wishlist] = await db.promise().query(
            `SELECT w.id, w.created_at, p.id as product_id, p.name, p.price, p.image_url
             FROM wishlists w
             JOIN products p ON w.product_id = p.id
             WHERE w.user_id = ?`,
            [userId]
        );
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add to wishlist
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    try {
        const [existing] = await db.promise().query(
            'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        await db.promise().query(
            'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
            [userId, product_id]
        );

        res.status(201).json({ message: 'Product added to wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove from wishlist
router.delete('/:productId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    try {
        const [result] = await db.promise().query(
            'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }

        res.json({ message: 'Product removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
