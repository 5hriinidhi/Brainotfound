const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// XP thresholds per level (1-10)
const XP_PER_LEVEL = [0, 100, 250, 500, 800, 1200, 1700, 2400, 3200, 4200];

// Game type → skill category mapping
const GAME_SKILL_MAP = {
    'coding-duel-development': 'Algorithms',
    'coding-duel-cybersecurity': 'Debugging',
    'coding-story': 'Problem Solving',
    'iot-circuit': 'Logical Reasoning',
    'iot-crisis': 'Data Structures',
    'iot-arena': 'SQL & Databases',
    'communication-speaking': 'Problem Solving',
};

// ── GET /api/skills ───────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('skills');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const enrichedSkills = user.skills.map((skill) => {
            const currentLevelXP = XP_PER_LEVEL[skill.level - 1] || 0;
            const nextLevelXP = XP_PER_LEVEL[skill.level] || XP_PER_LEVEL[9];
            const xpInCurrentLevel = skill.xp - currentLevelXP;
            const xpNeededForNext = nextLevelXP - currentLevelXP;
            const progress = Math.min(
                100,
                Math.round((xpInCurrentLevel / xpNeededForNext) * 100)
            );

            return {
                ...skill.toObject(),
                currentLevelXP,
                nextLevelXP,
                progress,
                isMaxLevel: skill.level >= 10,
                isUnlocked: skill.xp > 0 || skill.level > 1,
            };
        });

        res.json({ skills: enrichedSkills, xpPerLevel: XP_PER_LEVEL });
    } catch (err) {
        console.error('Get skills error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/skills/xp ──────────────────────────────────────────────────────
router.post('/xp', authMiddleware, async (req, res) => {
    try {
        const { skillName, xpGained } = req.body;

        if (!skillName || typeof xpGained !== 'number' || xpGained <= 0) {
            return res.status(400).json({ error: 'skillName and positive xpGained are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const skill = user.skills.find(
            (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!skill) {
            return res.status(404).json({ error: `Skill "${skillName}" not found` });
        }

        const penalty = skill.weakAreas.length > 0 ? 0.8 : 1;
        const adjustedXP = Math.round(xpGained * penalty);
        skill.xp += adjustedXP;

        let leveledUp = false;
        while (skill.level < 10 && skill.xp >= XP_PER_LEVEL[skill.level]) {
            skill.level += 1;
            leveledUp = true;
        }

        await user.save();

        res.json({
            skill: skill.toObject(),
            xpAwarded: adjustedXP,
            leveledUp,
            message: leveledUp
                ? `🎉 ${skillName} leveled up to ${skill.level}!`
                : `+${adjustedXP} XP for ${skillName}`,
        });
    } catch (err) {
        console.error('Award XP error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── GET /api/skills/assessments ───────────────────────────────────────────────
router.get('/assessments', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('assessments');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const sorted = user.assessments.sort((a, b) => b.date - a.date);
        res.json({ assessments: sorted });
    } catch (err) {
        console.error('Get assessments error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/skills/assessments ──────────────────────────────────────────────
router.post('/assessments', authMiddleware, async (req, res) => {
    try {
        const { testName, score, weakTopics } = req.body;

        if (!testName || typeof score !== 'number') {
            return res.status(400).json({ error: 'testName and score are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.assessments.push({
            testName,
            score: Math.min(100, Math.max(0, score)),
            weakTopics: weakTopics || [],
            date: new Date(),
        });

        await user.save();

        res.status(201).json({
            assessment: user.assessments[user.assessments.length - 1],
            message: 'Assessment recorded',
        });
    } catch (err) {
        console.error('Record assessment error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/skills/game-results ─────────────────────────────────────────────
// Unified endpoint for ALL games to report live performance
router.post('/game-results', authMiddleware, async (req, res) => {
    try {
        const { gameType, score, skillArea, weakTopics, xpEarned, metrics } = req.body;

        if (!gameType || typeof score !== 'number') {
            return res.status(400).json({ error: 'gameType and score are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Determine which skill to update
        const targetSkill = skillArea || GAME_SKILL_MAP[gameType] || 'Problem Solving';
        let skill = user.skills.find(
            (s) => s.skillName.toLowerCase() === targetSkill.toLowerCase()
        );

        if (!skill) {
            user.skills.push({
                skillName: targetSkill,
                level: 1,
                xp: 0,
                weakAreas: []
            });
            skill = user.skills[user.skills.length - 1];
        }

        // Calculate XP to award
        const baseXP = xpEarned || Math.round(score * 0.5);
        let actualXP = baseXP;
        let leveledUp = false;

        if (skill) {
            const penalty = skill.weakAreas.length > 0 ? 0.8 : 1;
            actualXP = Math.round(baseXP * penalty);
            skill.xp += actualXP;

            // Check for level ups
            while (skill.level < 10 && skill.xp >= XP_PER_LEVEL[skill.level]) {
                skill.level += 1;
                leveledUp = true;
            }

            // Update weak areas
            if (weakTopics && weakTopics.length > 0) {
                const existingWeak = new Set(skill.weakAreas);
                weakTopics.forEach((t) => existingWeak.add(t));
                skill.weakAreas = [...existingWeak].slice(0, 5);
            }

            // Clear weak areas if score is high
            if (score >= 85 && skill.weakAreas.length > 0) {
                skill.weakAreas = skill.weakAreas.slice(1);
            }
        }

        // Record assessment
        const testName = gameType
            .replace('coding-duel-', 'Coding Duel: ')
            .replace('coding-story', 'Story Mode Challenge')
            .replace('communication-speaking', 'Public Speaking')
            .replace('iot-circuit', 'IoT Circuit Debug')
            .replace('iot-crisis', 'IoT Crisis Mode')
            .replace('iot-arena', 'IoT Arena Match');

        user.assessments.push({
            testName,
            score: Math.min(100, Math.max(0, Math.round(score))),
            weakTopics: weakTopics || [],
            date: new Date(),
        });

        await user.save();

        res.status(201).json({
            message: leveledUp
                ? `🎉 ${targetSkill} leveled up to ${skill?.level}! +${actualXP} XP`
                : `+${actualXP} XP for ${targetSkill}`,
            xpAwarded: actualXP,
            leveledUp,
            skill: skill ? { name: skill.skillName, level: skill.level, xp: skill.xp } : null,
            assessment: user.assessments[user.assessments.length - 1],
        });
    } catch (err) {
        console.error('Game results error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
