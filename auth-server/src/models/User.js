const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    skillName: { type: String, required: true },
    level: { type: Number, default: 1, min: 1, max: 10 },
    xp: { type: Number, default: 0 },
    weakAreas: [String],
});

const assessmentSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    score: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    weakTopics: [String],
});

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            default: null, // null for Google-only users
        },
        profilePhoto: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
            maxlength: 200,
        },
        authProvider: {
            type: String,
            enum: ['local', 'google', 'both'],
            default: 'local',
        },
        googleId: {
            type: String,
            default: null,
        },
        skills: {
            type: [skillSchema],
            default: () => getDefaultSkills(),
        },
        assessments: [assessmentSchema],
    },
    { timestamps: true }
);

// Virtual: total XP
userSchema.virtual('totalXP').get(function () {
    return this.skills.reduce((sum, s) => sum + s.xp, 0);
});

// Virtual: highest level
userSchema.virtual('highestLevel').get(function () {
    return this.skills.reduce((max, s) => Math.max(max, s.level), 1);
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

function getDefaultSkills() {
    const categories = [
        'Logical Reasoning',
        'Data Structures',
        'Algorithms',
        'Problem Solving',
        'Debugging',
        'SQL & Databases',
    ];
    return categories.map((name) => ({
        skillName: name,
        level: 1,
        xp: 0,
        weakAreas: [],
    }));
}

module.exports = mongoose.model('User', userSchema);
