const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        // If role not in token, fetch from DB (for backward compatibility)
        if (!user.role) {
            try {
                const db = require('../db');
                const [users] = await db.promise().query('SELECT role FROM users WHERE id = ?', [user.id]);
                if (users.length > 0) {
                    req.user.role = users[0].role;
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        }
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

const isSeller = (req, res, next) => {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Seller access required' });
    }
    next();
};

module.exports = { authenticateToken, isAdmin, isSeller };