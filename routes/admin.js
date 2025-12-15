// ===================================
// Admin Routes - Dashboard API
// ===================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAdmin } = require('../middleware/admin');

// ===================================
// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin only
// ===================================

router.get('/stats', isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const newToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
        
        // Get users by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalAdmins,
                regularUsers: totalUsers - totalAdmins,
                newToday
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// ===================================
// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin only
// ===================================

router.get('/users', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        // Build search query
        const query = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        } : {};
        
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);
        
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        res.json({
            success: true,
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// ===================================
// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin only
// ===================================

router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent admin from deleting themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        await User.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: `User ${user.name} deleted successfully`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
});

// ===================================
// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Admin only
// ===================================

router.put('/users/:id/role', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: `${user.name} is now ${role}`,
            user
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating role'
        });
    }
});

// ===================================
// @route   GET /api/admin/check
// @desc    Check if current user is admin
// @access  Private
// ===================================

router.get('/check', async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.json({ isAdmin: false });
        }
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        res.json({ 
            isAdmin: user && user.role === 'admin',
            user: user ? { id: user._id, name: user.name, email: user.email } : null
        });
    } catch (error) {
        res.json({ isAdmin: false });
    }
});

module.exports = router;
