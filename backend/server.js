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

// Note: Socket.IO will be initialized after Express CORS setup so it can
// reuse the same allowed origins. This prevents mismatches between HTTP
// CORS and WebSocket CORS during development/production.

// Socket.IO will be created later (after CORS/allowedOrigins is defined)
// so that it can use the same origin whitelist as Express.

// Real-time Database Notifications (PostgreSQL Only)
if (process.env.DB_TYPE === 'postgres') {
    const { pool: pgPool } = require('./db');
    pgPool.connect((err, client, release) => {
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
} else {
    console.log('[Real-time] Skipping PG-specific LISTEN (MySQL environment)');
}

const PORT = process.env.PORT || 5000;

// Middleware - CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : [];

// Hardcoded fallback for Render deployment (ensures CORS works immediately)
const renderFrontendUrl = 'https://ecosync-hub-frontend.onrender.com';
if (!allowedOrigins.includes(renderFrontendUrl)) {
    allowedOrigins.push(renderFrontendUrl);
}

// In production, use explicit origins; in development, allow all
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) {
            return callback(null, true);
        }

        // If no FRONTEND_URL is set, allow all origins (development mode)
        if (allowedOrigins.length === 0) {
            console.log(`[CORS] Allowing origin (dev mode): ${origin}`);
            return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            console.log(`[CORS] Allowing origin: ${origin}`);
            return callback(null, true);
        }

        // Reject origin
        console.warn(`[CORS] Rejecting origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.IO with CORS that matches Express `allowedOrigins` so
// WebSocket connections are allowed from the same origins as HTTP requests.
const socketCorsOrigin = allowedOrigins.length === 0 ? true : allowedOrigins;
const io = socketIo(server, {
    cors: {
        origin: socketCorsOrigin,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Expose io to routes
app.set('io', io);

// Export io for use in routes
module.exports.io = io;

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
const postsRoutes = require('./routes/posts');
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

const socialFeaturesRoutes = require('./routes/social-features');
const insightsRoutes = require('./routes/insights');

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
app.use('/api/posts', postsRoutes);
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
app.use('/api', socialFeaturesRoutes);
app.use('/api/public/insights', insightsRoutes);


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
        socket.role = decoded.role; // Save role from token
        next();
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.role})`);

    // Join user's personal room and role-based rooms
    socket.join(`user:${socket.userId}`); // For buyer updates

    // For legacy support or direct messaging
    socket.join(socket.userId);

    if (socket.role === 'seller' || socket.role === 'admin') {
        socket.join(`seller:${socket.userId}`); // For seller updates
        console.log(`Joined seller room: seller:${socket.userId}`);
    }

    if (socket.role === 'admin') {
        socket.join('admin:room'); // For admin dashboards
        console.log(`Joined admin room: admin:room`);
    }

    // Handle private messages (New Conversation-based logic)
    socket.on('private_message', async (data) => {
        const { conversation_id, content, receiver_id } = data;
        try {
            let convId = conversation_id;

            // If no conversation_id, find or create one (legacy/start new chat support)
            if (!convId && receiver_id) {
                const [existing] = await db.query(
                    `SELECT conversation_id FROM conversation_participants 
                     WHERE user_id = ? AND conversation_id IN 
                     (SELECT conversation_id FROM conversation_participants WHERE user_id = ?)`,
                    [socket.userId, receiver_id]
                );

                if (existing.length > 0) {
                    convId = existing[0].conversation_id;
                } else {
                    const [newConv] = await db.query('INSERT INTO conversations (title) VALUES (?)', [`Chat ${socket.userId}-${receiver_id}`]);
                    convId = newConv.insertId;
                    await db.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
                        [convId, socket.userId, convId, receiver_id]);
                }
            }

            if (!convId) return socket.emit('message_error', { error: 'No conversation target' });

            // Save message to database
            const [result] = await db.query(
                'INSERT INTO messages (sender_id, conversation_id, content, message_type) VALUES (?, ?, ?, ?)',
                [socket.userId, convId, content, 'text']
            );

            const message = {
                id: result.insertId,
                sender_id: socket.userId,
                conversation_id: convId,
                content,
                created_at: new Date()
            };

            // Broadcast to the conversation room
            io.to(`conv:${convId}`).emit('new_message', message);

            // Notify specific user with a ping (for notifications/ui count)
            if (receiver_id) {
                socket.to(`user:${receiver_id}`).emit('message_notification', {
                    conversation_id: convId,
                    content: content.substring(0, 50)
                });
            }
        } catch (error) {
            console.error('Socket Message Error:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    });

    // Join conversation rooms
    socket.on('join_conversation', (convId) => {
        socket.join(`conv:${convId}`);
        console.log(`User ${socket.userId} joined conversation: ${convId}`);
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