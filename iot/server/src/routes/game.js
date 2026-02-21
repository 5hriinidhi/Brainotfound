/**
 * Game Routes — Score Submission & Leaderboard.
 *
 * POST /api/submit-score (auth required):
 *   - Server-side score validation: max 270 (9 questions × 30 pts)
 *   - XP calculation with accuracy bonuses
 *   - ELO rating update using expected-score formula
 *   - Rate limited to 1 submission per 10 seconds
 *
 * GET /api/leaderboard (public):
 *   - Returns top 10 users sorted by ELO rating
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Match = require('../models/Match');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Rate limiter: 1 score submission per 10 seconds per IP ───────────────────
const submitLimiter = rateLimit({
    windowMs: 10_000,
    max: 1,
    message: { error: 'Too many submissions. Wait 10 seconds.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_QUESTIONS = 9;
const MAX_SCORE_PER_Q = 30;
const MAX_TOTAL_SCORE = MAX_QUESTIONS * MAX_SCORE_PER_Q; // 270
const VALID_MODES = ['debug', 'crisis'];

// ── POST /api/submit-score ──────────────────────────────────────────────────
router.post('/submit-score', authMiddleware, submitLimiter, async (req, res) => {
    try {
        const { mode, score } = req.body;
        const userId = req.user.id;

        // ── Input validation ──────────────────────────────────────────────
        if (!mode || score == null) {
            return res.status(400).json({ error: 'mode and score are required' });
        }

        if (!VALID_MODES.includes(mode)) {
            return res.status(400).json({ error: 'mode must be "debug" or "crisis"' });
        }

        // ── Server-side score protection ──────────────────────────────────
        const validScore = Math.max(0, Math.min(Math.round(Number(score)), MAX_TOTAL_SCORE));
        if (isNaN(validScore)) {
            return res.status(400).json({ error: 'Invalid score value' });
        }

        // ── Find the authenticated user ───────────────────────────────────
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // ── XP Calculation (base + accuracy bonus) ────────────────────────
        const pct = (validScore / MAX_TOTAL_SCORE) * 100;
        let xpEarned = validScore;
        if (pct > 85) xpEarned += 50;
        else if (pct > 70) xpEarned += 30;
        else if (pct > 50) xpEarned += 15;

        // ── ELO Calculation (K=32, expected against 1500 baseline) ────────
        const K = 32;
        const result = Math.min(validScore / MAX_TOTAL_SCORE, 1);
        const expectedScore = 1 / (1 + Math.pow(10, (1500 - user.eloRating) / 400));
        const eloChange = Math.round(K * (result - expectedScore));
        const newElo = Math.max(0, user.eloRating + eloChange);

        // ── Persist updates ───────────────────────────────────────────────
        user.totalXP += xpEarned;
        user.eloRating = newElo;
        if (validScore > user.bestScore) user.bestScore = validScore;
        await user.save();

        const match = await Match.create({
            userId: user._id,
            mode,
            score: validScore,
            xpEarned,
            eloChange,
        });

        res.json({
            success: true,
            user: {
                username: user.username,
                totalXP: user.totalXP,
                bestScore: user.bestScore,
                eloRating: user.eloRating,
            },
            match: { id: match._id, xpEarned, eloChange },
        });
    } catch (err) {
        console.error('submit-score error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── GET /api/leaderboard (public) ───────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find()
            .sort({ eloRating: -1 })
            .limit(10)
            .select('username totalXP bestScore eloRating')
            .lean();

        res.json({ leaderboard: users });
    } catch (err) {
        console.error('leaderboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
