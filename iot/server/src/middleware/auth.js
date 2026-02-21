/**
 * Auth Middleware — verifies JWT token from Authorization header.
 * Attaches decoded user { id, username } to req.user.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'brainnotfound-iot-secret-2024';

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username }
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { authMiddleware, JWT_SECRET };
