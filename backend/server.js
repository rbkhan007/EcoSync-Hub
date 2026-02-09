const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const db = require('./db').promise();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Export io for use in routes
module.exports.io = io;

// Real-time Database Notifications
const { pool } = require('./db');
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting for LISTEN:', err.stack);
        return;
    }
    client.query('LISTEN db_changes');
    client.on('notification', (msg) => {
        try {
            const payload = JSON.parse(msg.payload);
            console.log('Database Change Notification:', payload);
            io.emit('db_update', payload);
        } catch (e) {
            console.error('Error parsing notification payload:', e);
        }
    });

    client.on('error', (err) => {
        console.error('Database client error:', err);
        release();
    });
});

const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : "*";
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins === "*" || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const reviewRoutes = require('./routes/reviews');
const profileRoutes = require('./routes/profile');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const sellerRoutes = require('./routes/sellers');
const communityRoutes = require('./routes/community');
const challengeRoutes = require('./routes/challenges');
const carbonRoutes = require('./routes/carbon');
const notificationRoutes = require('./routes/notifications');
const friendRoutes = require('./routes/friends');
const wishlistRoutes = require('./routes/wishlist');
const addressRoutes = require('./routes/addresses');
const districtRoutes = require('./routes/districts');
const databaseRoutes = require('./routes/database');
const uploadRoutes = require('./routes/upload');
const quizRoutes = require('./routes/quiz');
const productCommentRoutes = require('./routes/product_comments');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/admin/database', databaseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/product-comments', productCommentRoutes);

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('System Operational');
});

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'EcoSync Hub API' });
});

// Public stats
app.get('/api/stats', async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as userCount,
                (SELECT COUNT(*) FROM products WHERE status = 'approved') as productCount,
                (SELECT COUNT(*) FROM orders) as orderCount,
                (SELECT SUM(carbon_saved_kg) FROM users) as totalCO2
        `);

        res.json({
            users: stats[0].userCount,
            products: stats[0].productCount,
            orders: stats[0].orderCount,
            totalCO2Saved: stats[0].totalCO2 || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Public Top Users
app.get('/api/leaderboard/top', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, avatar_url, carbon_saved_kg, role FROM users ORDER BY carbon_saved_kg DESC LIMIT 3');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Socket.IO authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.userId = decoded.id;
        next();
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Join user's room for private messages
    socket.join(socket.userId);

    // Handle private messages
    socket.on('private_message', async (data) => {
        const { receiver_id, content } = data;
        try {
            // Save message to database
            const [result] = await db.query(
                'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
                [socket.userId, receiver_id, content]
            );

            const message = {
                id: result.insertId,
                sender_id: socket.userId,
                receiver_id,
                content,
                is_read: false,
                created_at: new Date()
            };

            // Send to receiver's room
            socket.to(receiver_id).emit('new_message', message);

            // Send confirmation to sender
            socket.emit('message_sent', message);
        } catch (error) {
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    });

    // Handle message read
    socket.on('mark_read', async (data) => {
        const { message_id } = data;
        try {
            await db.query(
                'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
                [message_id, socket.userId]
            );
            socket.emit('message_read', { message_id });
        } catch (error) {
            socket.emit('message_error', { error: 'Failed to mark as read' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Shutdown signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);