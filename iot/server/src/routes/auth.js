/**
 * Auth Routes — register and login (username-based, no password for simplicity).
 * Returns JWT token on success.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/register — Create new user ───────────────────────────────
router.post('/auth/register', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 2 || username.trim().length > 20) {
            return res.status(400).json({ error: 'Username must be 2-20 characters' });
        }

        const clean = username.trim().toLowerCase();

        // Check if username already exists
        const existing = await User.findOne({ username: clean });
        if (existing) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const user = await User.create({ username: clean });
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                totalXP: user.totalXP,
                bestScore: user.bestScore,
                eloRating: user.eloRating,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/auth/login — Login existing user ──────────────────────────────
router.post('/auth/login', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 2) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const clean = username.trim().toLowerCase();
        const user = await User.findOne({ username: clean });

        if (!user) {
            return res.status(404).json({ error: 'User not found. Register first.' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                totalXP: user.totalXP,
                bestScore: user.bestScore,
                eloRating: user.eloRating,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
