const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const [reviews] = await db.promise().query(
            `SELECT r.rating, r.comment, r.created_at, u.username
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
            [productId]
        );
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Check if user is eligible to review
router.get('/eligibility/:productId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    try {
        // Check if user has purchased the product and it's delivered
        const [purchased] = await db.promise().query(
            `SELECT oi.id FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
            [userId, productId]
        );

        // Check if already reviewed
        const [existing] = await db.promise().query(
            'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        res.json({
            canReview: purchased.length > 0 && existing.length === 0,
            hasPurchased: purchased.length > 0,
            alreadyReviewed: existing.length > 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Submit a review
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Product ID and valid rating (1-5) are required' });
    }

    try {
        // Check if user has purchased the product
        const [purchased] = await db.promise().query(
            `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
            [userId, product_id]
        );

        if (purchased.length === 0) {
            return res.status(403).json({ message: 'You can only review products you have purchased and received' });
        }

        // Check if already reviewed
        const [existing] = await db.promise().query(
            'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Insert review
        const [result] = await db.promise().query(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
            [userId, product_id, rating, comment]
        );

        res.status(201).json({ message: 'Review submitted', reviewId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;