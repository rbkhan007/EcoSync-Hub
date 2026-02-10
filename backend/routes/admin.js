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
        const [users] = await db.query('SELECT id, username, email, profile_picture FROM users WHERE role = ? AND deleted_at IS NULL', ['user']);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve seller
router.post('/sellers/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'UPDATE users SET role = ? WHERE id = ? AND role = ?',
            ['seller', id, 'user']
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Seller not found or already approved' });
        }

        // Add notification for the user
        const [notifResult] = await db.query(
            'INSERT INTO notifications (user_id, type, target_id, message) VALUES (?, ?, ?, ?)',
            [id, 'info', id, 'Congratulations! You are now a verified seller.']
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
        const [products] = await db.query('SELECT * FROM products WHERE status = ?', ['pending']);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve product
router.post('/products/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'UPDATE products SET status = ? WHERE id = ? AND status = ?',
            ['approved', id, 'pending']
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found or already approved' });
        }

        // Get seller_id to notify
        const [products] = await db.query('SELECT seller_id, name FROM products WHERE id = ?', [id]);
        if (products.length > 0 && products[0].seller_id) {
            const sellerId = products[0].seller_id;
            const [notifResult] = await db.query(
                'INSERT INTO notifications (user_id, type, target_id, message) VALUES (?, ?, ?, ?)',
                [sellerId, 'info', id, `Your product "${products[0].name}" has been approved.`]
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
        const [result] = await db.query(
            'UPDATE products SET status = ? WHERE id = ? AND status = ?',
            ['rejected', id, 'pending']
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
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
        const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders');
        const [totalCO2] = await db.query('SELECT SUM(carbon_saved_kg) as total FROM users');

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
        const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
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
        const [result] = await db.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User soft-deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Analytics: Sales Trends
router.get('/analytics/sales', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) as revenue, COUNT(*) as order_count
            FROM orders
            GROUP BY month
            ORDER BY month DESC
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Analytics: Sustainability Impact
router.get('/analytics/eco-impact', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT DATE_TRUNC('day', logged_at) as date, SUM(amount_kg) as co2_saved
            FROM carbon_logs
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Analytics: User Growth
router.get('/analytics/user-growth', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as new_users
            FROM users
            GROUP BY week
            ORDER BY week DESC
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all users (admin view)
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, email, role, created_at, district_id FROM users WHERE deleted_at IS NULL');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all orders (admin view)
router.get('/orders', async (req, res) => {
    try {
        const [orders] = await db.query('SELECT o.*, u.username as buyer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all badges (Admin)
router.get('/badges', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [badges] = await db.query('SELECT * FROM badges');
        res.json(badges);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new badge
router.post('/badges', authenticateToken, isAdmin, async (req, res) => {
    const { name, description, icon_url } = req.body;
    try {
        await db.query('INSERT INTO badges (name, description, icon_url) VALUES (?, ?, ?)', [name, description, icon_url]);
        res.status(201).json({ message: 'Badge created' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get system usage stats
router.get('/system-stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [postCount] = await db.query('SELECT COUNT(*) as count FROM posts');
        const [sessionCount] = await db.query('SELECT COUNT(*) as count FROM user_sessions');
        res.json({
            users: userCount[0].count,
            posts: postCount[0].count,
            activeSessions: sessionCount[0].count
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
