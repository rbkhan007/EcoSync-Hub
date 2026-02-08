const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// Get pending sellers (assume users with role 'user' are pending sellers)
router.get('/sellers/pending', async (req, res) => {
    try {
        const [users] = await db.promise().query('SELECT id, username, email, avatar_url FROM users WHERE role = "user"');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve seller
router.post('/sellers/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'UPDATE users SET role = "seller" WHERE id = ? AND role = "user"',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Seller not found or already approved' });
        }

        // Add notification for the user
        const [notifResult] = await db.promise().query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [id, 'Seller Approved', 'Congratulations! You are now a verified seller.', 'info']
        );

        // Real-time sync
        const io = require('../server').io;
        if (io) {
            io.to(id).emit('new_notification', {
                id: notifResult.insertId,
                title: 'Seller Approved',
                message: 'Congratulations! You are now a verified seller.',
                type: 'info',
                created_at: new Date()
            });
        }

        res.json({ message: 'Seller approved' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending products
router.get('/products/pending', async (req, res) => {
    try {
        const [products] = await db.promise().query('SELECT * FROM products WHERE status = "pending"');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve product
router.post('/products/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'UPDATE products SET status = "approved" WHERE id = ? AND status = "pending"',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found or already approved' });
        }

        // Get seller_id to notify
        const [products] = await db.promise().query('SELECT seller_id, name FROM products WHERE id = ?', [id]);
        if (products.length > 0 && products[0].seller_id) {
            const sellerId = products[0].seller_id;
            const [notifResult] = await db.promise().query(
                'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
                [sellerId, 'Product Approved', `Your product "${products[0].name}" has been approved.`, 'success', id, 'product']
            );

            // Real-time sync
            const io = require('../server').io;
            if (io) {
                io.to(sellerId).emit('new_notification', {
                    id: notifResult.insertId,
                    title: 'Product Approved',
                    message: `Your product "${products[0].name}" has been approved.`,
                    type: 'success',
                    created_at: new Date()
                });
            }
        }

        res.json({ message: 'Product approved' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reject product
router.post('/products/:id/reject', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'UPDATE products SET status = "rejected" WHERE id = ? AND status = "pending"',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found or already processed' });
        }
        res.json({ message: 'Product rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending posts (no posts table, return empty)
router.get('/posts/pending', (req, res) => {
    res.json([]);
});

// Approve post
router.post('/posts/:id/approve', (req, res) => {
    res.status(404).json({ message: 'Posts not implemented' });
});

// Reject post
router.post('/posts/:id/reject', (req, res) => {
    res.status(404).json({ message: 'Posts not implemented' });
});

// Get overall platform stats
router.get('/stats', async (req, res) => {
    try {
        const [userCount] = await db.promise().query('SELECT COUNT(*) as count FROM users');
        const [productCount] = await db.promise().query('SELECT COUNT(*) as count FROM products');
        const [orderCount] = await db.promise().query('SELECT COUNT(*) as count FROM orders');
        const [totalCO2] = await db.promise().query('SELECT SUM(carbon_saved_kg) as total FROM users');

        res.json({
            users: userCount[0].count,
            products: productCount[0].count,
            orders: orderCount[0].count,
            totalCO2Saved: totalCO2[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'seller', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const [result] = await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User role updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;