// ===================================
// Admin Middleware - Check Admin Role
// ===================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please login.'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }
        
        // Add user to request
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

module.exports = { isAdmin };
