const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Mock OTP Storage (In production, use Redis)
const otpStore = new Map();

// Send OTP
router.post('/otp/send', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

        otpStore.set(phone, { otp, expiresAt });

        console.log(`[OTP] Sent to ${phone}: ${otp}`);

        // In production, integrate with SMS gateway here
        res.json({ message: 'OTP sent successfully (mocked)', phone });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    }
});

// Verify OTP
router.post('/otp/verify', async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    try {
        const stored = otpStore.get(phone);

        if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // OTP verified, check if user exists or needs registration
        const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);

        // Clear OTP
        otpStore.delete(phone);

        if (users.length > 0) {
            const user = users[0];
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            return res.json({
                message: 'Login successful',
                token,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    profile_picture: user.profile_picture,
                    eco_points: user.eco_points,
                    display_name: user.display_name
                }
            });
        } else {
            // User doesn't exist, signal frontend to proceed to registration
            return res.status(200).json({ message: 'OTP verified, please complete registration', phone, needs_registration: true });
        }
    } catch (error) {
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { username, email, password, firstName, lastName, phone, gender, districtId, upazilaId } = req.body;

    if (!username || !email || !password || !firstName || !lastName || !phone) {
        return res.status(400).json({ message: 'Required fields missing' });
    }

    try {
        // Check if user exists
        const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const [existingUsername] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`.trim();

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (username, full_name, display_name, email, password_hash, phone, gender, district_id, upazila_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, fullName, firstName, email, hashedPassword, phone, gender || 'other', districtId || null, upazilaId || null]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT access token (short-lived: 1 hour)
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Generate Refresh Token
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        // Record session and update last_seen
        await db.query('INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
            [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
        await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);

        res.json({
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                profile_picture: user.profile_picture,
                streak_days: user.streak_days,
                last_active_date: user.last_active_date,
                eco_points: user.eco_points,
                follower_count: user.follower_count,
                following_count: user.following_count,
                friend_count: user.friend_count
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Refresh JWT Token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Fetch user to get current role
        const [users] = await db.query('SELECT id, email, role FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const user = users[0];
        const newToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Token refreshed', token: newToken });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid refresh token', error: error.message });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    res.json({ message: 'Logout successful' });
});

// Get users (with search)
router.get('/users', async (req, res) => {
    const { search } = req.query;
    try {
        let query = 'SELECT id, username, display_name, email, role, profile_picture, bio, eco_points FROM users';
        let params = [];
        if (search) {
            query += ' WHERE username LIKE ? OR display_name LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        const [users] = await db.query(query, params);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user by ID
router.get('/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [users] = await db.query('SELECT id, username, display_name, profile_picture, bio, eco_points, carbon_saved_kg, trees_planted, role, created_at FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get public stats
router.get('/stats', async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [productCount] = await db.query('SELECT COUNT(*) as count FROM products WHERE status = \'approved\'');
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

// Get current authenticated user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.query(
            'SELECT id, username, display_name, full_name, email, phone, profile_picture, bio, eco_points, carbon_saved_kg, trees_planted, role, streak_days, last_active_date, created_at, district_id, upazila_id, follower_count, following_count, friend_count FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const [resets] = await db.query(
            'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (resets.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = resets[0].user_id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
        await db.query('DELETE FROM password_resets WHERE token = ?', [token]);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    const { token } = req.body;
    try {
        const [verifications] = await db.query(
            'SELECT user_id FROM email_verifications WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (verifications.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = verifications[0].user_id;
        await db.query('DELETE FROM email_verifications WHERE token = ?', [token]);

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
