// ===================================
// JWT Authentication Middleware
// ===================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token from cookie or header
const protect = async (req, res, next) => {
    let token;
    
    // Check for token in cookie first, then Authorization header
    if (req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // No token found
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - No token provided'
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - User not found'
            });
        }
        
        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized - Invalid token'
        });
    }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    let token;
    
    if (req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        } catch (error) {
            // Token invalid, continue without user
        }
    }
    
    next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authorized as an admin'
        });
    }
};

module.exports = { protect, optionalAuth, isAdmin };
