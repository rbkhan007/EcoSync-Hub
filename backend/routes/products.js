const express = require('express');
const db = require('../db');
const { authenticateToken, isSeller } = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    const { districtId, search, category_id } = req.query;
    try {
        let query = 'SELECT p.*, u.district_id FROM products p JOIN users u ON p.seller_id = u.id WHERE p.status = ? AND p.deleted_at IS NULL';
        let params = ['approved'];

        if (districtId) {
            query += ' AND u.district_id = ?';
            params.push(districtId);
        }
        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }

        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get products for the authenticated seller
router.get('/my', authenticateToken, isSeller, async (req, res) => {
    const userId = req.user.id;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE seller_id = ? AND deleted_at IS NULL', [userId]);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/seller/me', authenticateToken, isSeller, async (req, res) => {
    // Alias to /my
    return res.redirect('/api/products/my');
});

// Get product by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [product] = await db.query('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
        if (product.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create product (seller/admin only)
router.post('/', authenticateToken, isSeller, async (req, res) => {
    const { name, description, price, category_id, stock, images, eco_rating, co2_saving_kg } = req.body;
    const sellerId = req.user.id;

    if (!name || !price) {
        return res.status(400).json({ message: 'Name and price are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, category_id, seller_id, stock, images, eco_rating, co2_saving_kg, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description || '', price, category_id || null, sellerId, stock || 0, images ? JSON.stringify(images) : null, eco_rating || 5, co2_saving_kg || 0.00, 'approved']
        );
        res.status(201).json({ message: 'Product created', productId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update product (seller/admin only)
router.put('/:id', authenticateToken, isSeller, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category_id, stock, images, eco_rating, co2_saving_kg } = req.body;
    const sellerId = req.user.id;
    const userRole = req.user.role;

    try {
        // Verify ownership unless admin
        const [existing] = await db.query('SELECT seller_id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

        if (userRole !== 'admin' && existing[0].seller_id !== sellerId) {
            return res.status(403).json({ message: 'You can only edit your own products' });
        }

        await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, images = ?, eco_rating = ?, co2_saving_kg = ? WHERE id = ?',
            [name, description || '', price, category_id || null, stock || 0, images ? JSON.stringify(images) : null, eco_rating || 5, co2_saving_kg || 0.00, id]
        );
        res.json({ message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete product (Soft delete)
router.delete('/:id', authenticateToken, isSeller, async (req, res) => {
    const { id } = req.params;
    const sellerId = req.user.id;
    const userRole = req.user.role;

    try {
        // Verify ownership unless admin
        const [existing] = await db.query('SELECT seller_id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

        if (userRole !== 'admin' && existing[0].seller_id !== sellerId) {
            return res.status(403).json({ message: 'You can only delete your own products' });
        }

        await db.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
