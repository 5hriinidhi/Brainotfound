const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 2,
            maxlength: 20,
        },
        totalXP: {
            type: Number,
            default: 0,
        },
        bestScore: {
            type: Number,
            default: 0,
        },
        eloRating: {
            type: Number,
            default: 1000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
