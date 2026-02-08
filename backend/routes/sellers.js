const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get seller by slug (username)
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const [users] = await db.promise().query(
            'SELECT id, username, email, bio, avatar_url, eco_points FROM users WHERE username = ?',
            [slug]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Apply to become seller
router.post('/apply', authenticateToken, async (req, res) => {
    // Mock application - in real app, create application record or notification
    res.json({ message: 'Application submitted. Admin will review it soon.' });
});

// Get seller dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
    const sellerId = req.user.id;
    try {
        const [productCount] = await db.promise().query('SELECT COUNT(*) as count FROM products WHERE seller_id = ?', [sellerId]);
        const [orderCount] = await db.promise().query(
            'SELECT COUNT(DISTINCT oi.order_id) as count FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.seller_id = ?',
            [sellerId]
        );
        const [revenue] = await db.promise().query(
            'SELECT SUM(oi.price * oi.quantity) as total FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.seller_id = ?',
            [sellerId]
        );
        const [impact] = await db.promise().query(
            'SELECT SUM(p.co2_reduction_kg * oi.quantity) as total FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.seller_id = ?',
            [sellerId]
        );

        res.json({
            products: productCount[0].count,
            orders: orderCount[0].count,
            revenue: revenue[0].total || 0,
            eco_impact: impact[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get seller dashboard orders
router.get('/dashboard/orders', authenticateToken, async (req, res) => {
    const sellerId = req.user.id;
    try {
        const [orders] = await db.promise().query(
            `SELECT o.id, o.total_amount, o.status, o.created_at, u.username as customer_name, 
             SUM(oi.quantity) as total_items, STRING_AGG(p.name, ', ') as product_names
             FROM orders o
             JOIN users u ON o.user_id = u.id
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id
             WHERE p.seller_id = ?
             GROUP BY o.id, u.username
             ORDER BY o.created_at DESC`,
            [sellerId]
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get seller dashboard customers
router.get('/dashboard/customers', authenticateToken, async (req, res) => {
    const sellerId = req.user.id;
    try {
        const [customers] = await db.promise().query(
            `SELECT DISTINCT u.id, u.username, u.email, u.avatar_url, 
             COUNT(DISTINCT o.id) as order_count, SUM(oi.price * oi.quantity) as total_spent
             FROM users u
             JOIN orders o ON u.id = o.user_id
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id
             WHERE p.seller_id = ?
             GROUP BY u.id, u.username, u.email, u.avatar_url`,
            [sellerId]
        );
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
