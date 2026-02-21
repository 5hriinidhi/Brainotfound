const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
