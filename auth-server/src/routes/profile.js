const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Multer config for profile photo uploads ───────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        if (extOk && mimeOk) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    },
});

// ── GET /api/profile ──────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { name, bio } = req.body;
        const updates = {};

        if (name && name.trim().length >= 2 && name.trim().length <= 50) {
            updates.name = name.trim();
        }
        if (bio !== undefined && bio.length <= 200) {
            updates.bio = bio;
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user, message: 'Profile updated' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/profile/photo ───────────────────────────────────────────────────
router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const photoURL = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePhoto: photoURL },
            { new: true }
        ).select('-password');

        res.json({ user, profilePhoto: photoURL, message: 'Photo updated' });
    } catch (err) {
        console.error('Photo upload error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
