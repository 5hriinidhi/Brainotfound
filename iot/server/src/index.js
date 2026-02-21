require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/health');
const gameRoutes = require('./routes/game');
const authRoutes = require('./routes/auth');
const { registerSocketHandlers } = require('./multiplayer/socketHandler');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;

// ── HTTP Server + Socket.io ──────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed'));
            }
        },
        methods: ['GET', 'POST'],
    },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Serve Static Frontend ───────────────────────────────────────────────────
const outPath = path.join(__dirname, '../../client/out');
app.use(express.static(outPath));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', gameRoutes);

// ── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.path.includes('.')) return next();

    // For Next.js static export, routes are often folder/index.html or folder.html
    const cleanPath = req.path.replace(/\/$/, "");
    if (cleanPath === "/circuit") return res.sendFile(path.join(outPath, 'circuit.html'));
    if (cleanPath === "/crisis") return res.sendFile(path.join(outPath, 'crisis.html'));
    if (cleanPath === "/arena") return res.sendFile(path.join(outPath, 'arena.html'));

    res.sendFile(path.join(outPath, 'index.html'));
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
registerSocketHandlers(io);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
    // Attempt DB connection in background (non-blocking for startup)
    if (process.env.MONGO_URI) {
        connectDB().catch(err => {
            console.error('❌ Background MongoDB Connection Error:', err.message);
        });
    } else {
        console.warn('⚠️ MONGO_URI not found. Running in DB-less mode.');
    }

    httpServer.listen(PORT, () => {
        console.log(`🚀 IoT Server running on http://localhost:${PORT}`);
        console.log(`🔌 Socket.io ready on ws://localhost:${PORT}`);
    });
};

start();
