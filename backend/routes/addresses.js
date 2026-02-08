const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user addresses
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [addresses] = await db.promise().query(
            'SELECT * FROM user_addresses WHERE user_id = ?',
            [userId]
        );
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new address
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { address_type, full_name, phone, house_flat_no, road_street, area_locality, post_office, thana_upazila, district, division, postal_code, country, is_default } = req.body;

    if (!full_name || !house_flat_no || !thana_upazila || !district || !postal_code) {
        return res.status(400).json({ message: 'Required fields missing: full_name, house_flat_no, thana_upazila, district, postal_code' });
    }

    try {
        if (is_default) {
            await db.promise().query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }

        const [result] = await db.promise().query(
            'INSERT INTO user_addresses (user_id, address_type, full_name, phone, house_flat_no, road_street, area_locality, post_office, thana_upazila, district, division, postal_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, address_type || 'home', full_name, phone || '', house_flat_no, road_street || '', area_locality || '', post_office || '', thana_upazila, district, division || '', postal_code, country || 'BANGLADESH', is_default || false]
        );

        res.status(201).json({ message: 'Address added', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update address
router.put('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { address_type, full_name, phone, house_flat_no, road_street, area_locality, post_office, thana_upazila, district, division, postal_code, country, is_default } = req.body;

    try {
        if (is_default) {
            await db.promise().query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }

        const [result] = await db.promise().query(
            'UPDATE user_addresses SET address_type = ?, full_name = ?, phone = ?, house_flat_no = ?, road_street = ?, area_locality = ?, post_office = ?, thana_upazila = ?, district = ?, division = ?, postal_code = ?, country = ?, is_default = ? WHERE id = ? AND user_id = ?',
            [address_type || 'home', full_name, phone || '', house_flat_no, road_street || '', area_locality || '', post_office || '', thana_upazila, district, division || '', postal_code, country || 'BANGLADESH', is_default || false, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ message: 'Address updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete address
router.delete('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.json({ message: 'Address deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
