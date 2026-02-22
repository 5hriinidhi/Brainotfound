require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const skillsRoutes = require('./routes/skills');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Ensure uploads directory exists ───────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from any localhost port in dev
        if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ── Rate limiting on auth endpoints ───────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillsRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'skillforge-auth', port: PORT });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
    if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('YOUR_')) {
        await connectDB();
    } else {
        console.warn('⚠️  MONGO_URI not configured. Running in DB-less mode.');
    }

    app.listen(PORT, () => {
        console.log(`🔐 SkillForge Auth Server running on http://localhost:${PORT}`);
    });
};

start();
