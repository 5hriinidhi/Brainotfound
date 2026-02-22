const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// ── Cookie options ────────────────────────────────────────────────────────────
const COOKIE_OPTS = {
    httpOnly: true,
    secure: false, // set true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email already exists
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            authProvider: 'local',
        });

        const token = generateToken(user);

        res.cookie('sf_token', token, COOKIE_OPTS);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
                totalXP: user.totalXP,
                highestLevel: user.highestLevel,
            },
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(401).json({
                error: 'This account uses Google login. Please sign in with Google.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);

        res.cookie('sf_token', token, COOKIE_OPTS);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
                totalXP: user.totalXP,
                highestLevel: user.highestLevel,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    res.clearCookie('sf_token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const { authMiddleware } = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
                bio: user.bio,
                totalXP: user.totalXP,
                highestLevel: user.highestLevel,
                skillsCount: user.skills.length,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── GET /api/auth/google ──────────────────────────────────────────────────────
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
        const token = generateToken(req.user);
        res.cookie('sf_token', token, COOKIE_OPTS);
        // Redirect back to client with token in URL (for localStorage pickup)
        const clientURL = process.env.CLIENT_URL || 'http://localhost:8080';
        res.redirect(`${clientURL}?auth_token=${token}`);
    }
);

module.exports = router;
