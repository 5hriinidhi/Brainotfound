const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        mode: {
            type: String,
            enum: ['debug', 'crisis'],
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        xpEarned: {
            type: Number,
            default: 0,
        },
        eloChange: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
