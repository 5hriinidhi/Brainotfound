const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'skillforge-super-secret-jwt-key-2024';

function authMiddleware(req, res, next) {
    // Try cookie first, then Authorization header
    let token = req.cookies?.sf_token;

    if (!token) {
        const header = req.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
            token = header.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, name }
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = { authMiddleware, generateToken, JWT_SECRET };
