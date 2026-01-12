import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware
 * Verifies JWT token from Authorization header
 * Attaches user to request object if valid
 */
const protect = async (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'accessible_secret_key');

            // Get user from token (exclude pin from response)
            req.user = await User.findById(decoded.id).select('-pin');

            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
};

export { protect };
