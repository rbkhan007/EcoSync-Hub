const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [cartItems] = await db.promise().query(
            `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
            [userId]
        );
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add to cart
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    try {
        // Check if item already in cart
        const [existing] = await db.promise().query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (existing.length > 0) {
            // Update quantity
            await db.promise().query(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, existing[0].id]
            );
            res.json({ message: 'Cart updated' });
        } else {
            // Add new item
            await db.promise().query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, quantity]
            );
            res.status(201).json({ message: 'Item added to cart' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update cart item
router.put('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Valid quantity is required' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        res.json({ message: 'Cart item updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove from cart
router.delete('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await db.promise().query(
            'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
