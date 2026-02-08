const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's orders (protected)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [orders] = await db.promise().query(`
            SELECT o.*, p.status as payment_status, p.payment_method, p.amount as paid_amount
            FROM orders o
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [userId]);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create order (protected)
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { total_amount, shipping_address, order_items } = req.body;

    if (!total_amount || !order_items || order_items.length === 0) {
        return res.status(400).json({ message: 'Total amount and order items are required' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // Insert order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)',
            [userId, total_amount, shipping_address || '']
        );
        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of order_items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Order created', orderId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;