const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initiate payment
router.post('/initiate', authenticateToken, (req, res) => {
    const { amount, order_id } = req.body;

    if (!amount || !order_id) {
        return res.status(400).json({ message: 'Amount and order ID are required' });
    }

    // Mock payment initiation
    const paymentIntent = {
        id: 'pi_mock_' + Date.now(),
        amount: amount,
        order_id: order_id,
        status: 'pending'
    };

    res.json({ message: 'Payment initiated', paymentIntent });
});

// Confirm payment (mock)
router.post('/confirm', authenticateToken, async (req, res) => {
    const { payment_intent_id, order_id, amount, payment_method } = req.body;

    if (!payment_intent_id || !order_id || !amount) {
        return res.status(400).json({ message: 'Payment intent ID, order ID, and amount are required' });
    }

    const db = require('../db');
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // Insert payment record
        await connection.query(
            'INSERT INTO payments (order_id, payment_intent_id, amount, currency, status, payment_method) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (payment_intent_id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP',
            [order_id, payment_intent_id, amount, 'BDT', 'succeeded', payment_method || 'card']
        );

        // Update order status to paid and link payment
        await connection.query(
            'UPDATE orders SET status = ?, payment_intent_id = ? WHERE id = ? AND user_id = ?',
            ['paid', payment_intent_id, order_id, req.user.id]
        );

        // Calculate and credit CO2 reduction from products
        const [orderItems] = await connection.query(
            `SELECT p.co2_reduction_kg, oi.quantity 
             FROM order_items oi 
             JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?`,
            [order_id]
        );

        let totalCO2Saved = 0;
        orderItems.forEach(item => {
            totalCO2Saved += (item.co2_reduction_kg * item.quantity);
        });

        if (totalCO2Saved > 0) {
            await connection.query(
                'UPDATE users SET carbon_saved_kg = carbon_saved_kg + ? WHERE id = ?',
                [totalCO2Saved, req.user.id]
            );

            await connection.query(
                'INSERT INTO carbon_logs (user_id, amount_kg, source) VALUES (?, ?, ?)',
                [req.user.id, totalCO2Saved, `Purchase: Order #${order_id}`]
            );
        }

        // Add notification for the user
        const [notifResult] = await connection.query(
            'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'Payment Successful', `Your payment for order #${order_id} was successful! You saved ${totalCO2Saved}kg CO2.`, 'order', order_id, 'order_payment']
        );

        // Real-time sync
        const io = require('../server').io;
        if (io) {
            io.to(req.user.id).emit('new_notification', {
                id: notifResult.insertId,
                title: 'Payment Successful',
                message: `Your payment for order #${order_id} was successful! You saved ${totalCO2Saved}kg CO2.`,
                type: 'order',
                created_at: new Date()
            });
        }

        await connection.commit();
        res.json({ message: 'Payment confirmed', status: 'paid' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;