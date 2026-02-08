const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comments for a product
router.get('/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const [comments] = await db.promise().query(
            'SELECT pc.id, pc.comment, pc.created_at, u.username, u.avatar_url, u.id as user_id ' +
            'FROM product_comments pc ' +
            'JOIN users u ON pc.user_id = u.id ' +
            'WHERE pc.product_id = ? ' +
            'ORDER BY pc.created_at DESC',
            [productId]
        );
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Post a comment
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { product_id, comment } = req.body;

    if (!product_id || !comment) {
        return res.status(400).json({ message: 'Product ID and comment are required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO product_comments (user_id, product_id, comment) VALUES (?, ?, ?)',
            [userId, product_id, comment]
        );
        res.status(201).json({ message: 'Comment posted', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
