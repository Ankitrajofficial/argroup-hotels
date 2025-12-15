const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { isAdmin } = require('../middleware/admin');

// ===================================
// Submit New Booking (Public)
// ===================================

router.post('/', async (req, res) => {
    try {
        const { name, email, phone, roomType, checkIn, checkOut, guests, specialRequests } = req.body;
        
        // Validation
        if (!name || !email || !phone || !roomType || !checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }
        
        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkInDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Check-in date cannot be in the past'
            });
        }
        
        if (checkOutDate <= checkInDate) {
            return res.status(400).json({
                success: false,
                message: 'Check-out date must be after check-in date'
            });
        }
        
        // Create booking
        const booking = new Booking({
            name,
            email,
            phone,
            roomType,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: guests || 2,
            specialRequests: specialRequests || ''
        });
        
        await booking.save();
        
        res.status(201).json({
            success: true,
            message: 'Booking request submitted successfully! We will contact you shortly.',
            booking: {
                id: booking._id,
                roomType: booking.roomType,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                status: booking.status
            }
        });
        
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting booking. Please try again.'
        });
    }
});

// ===================================
// Get Booking Statistics (Admin)
// ===================================

router.get('/stats', isAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const [pending, confirmed, cancelled, completed, todayCount, total] = await Promise.all([
            Booking.countDocuments({ status: 'pending' }),
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.countDocuments({ status: 'cancelled' }),
            Booking.countDocuments({ status: 'completed' }),
            Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            Booking.countDocuments()
        ]);
        
        res.json({
            success: true,
            stats: {
                pending,
                confirmed,
                cancelled,
                completed,
                today: todayCount,
                total
            }
        });
    } catch (error) {
        console.error('Booking stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking statistics'
        });
    }
});

// ===================================
// Get All Bookings (Admin)
// ===================================

router.get('/all', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        
        const query = { isArchived: { $ne: true } };
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        res.json({
            success: true,
            bookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalBookings: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings'
        });
    }
});

// ===================================
// Get Archived Bookings (Admin)
// IMPORTANT: This must come BEFORE /:id routes
// ===================================

router.get('/archived/all', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const query = { isArchived: true };
        
        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        res.json({
            success: true,
            bookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalBookings: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get archived bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching archived bookings'
        });
    }
});

// ===================================
// Get Single Booking (Admin)
// ===================================

router.get('/:id', isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking details'
        });
    }
});

// ===================================
// Update Booking Status (Admin)
// ===================================

router.put('/:id/status', isAdmin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { 
                status, 
                adminNotes: adminNotes || '',
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            message: `Booking status updated to ${status}`,
            booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking status'
        });
    }
});

// ===================================
// Delete Booking (Admin)
// ===================================

router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting booking'
        });
    }
});

// ===================================
// Get Payment Statistics (Admin)
// ===================================

router.get('/payment/stats', isAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Today's collection
        const todayPaidBookings = await Booking.find({
            paidAt: { $gte: today, $lt: tomorrow },
            paymentStatus: { $in: ['paid', 'partial'] }
        });
        const todayCollection = todayPaidBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
        
        // Total stats
        const [totalPaid, totalRevenue, unpaidCount, partialCount, refundedCount] = await Promise.all([
            Booking.countDocuments({ paymentStatus: 'paid' }),
            Booking.aggregate([
                { $match: { paymentStatus: { $in: ['paid', 'partial'] } } },
                { $group: { _id: null, total: { $sum: '$paidAmount' } } }
            ]),
            Booking.countDocuments({ paymentStatus: 'unpaid' }),
            Booking.countDocuments({ paymentStatus: 'partial' }),
            Booking.countDocuments({ paymentStatus: 'refunded' })
        ]);
        
        res.json({
            success: true,
            stats: {
                todayCollection,
                totalRevenue: totalRevenue[0]?.total || 0,
                paidCount: totalPaid,
                unpaidCount,
                partialCount,
                refundedCount
            }
        });
    } catch (error) {
        console.error('Payment stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment statistics'
        });
    }
});

// ===================================
// Update Payment Status (Admin)
// ===================================

router.put('/:id/payment', isAdmin, async (req, res) => {
    try {
        const { paymentStatus, paymentAmount, paidAmount } = req.body;
        
        if (!['unpaid', 'partial', 'paid', 'refunded'].includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }
        
        const updateData = {
            paymentStatus,
            paymentAmount: paymentAmount || 0,
            paidAmount: paidAmount || 0,
            updatedAt: Date.now()
        };
        
        // Set paidAt timestamp when marked as paid
        if (paymentStatus === 'paid') {
            updateData.paidAt = Date.now();
            // Auto-confirm booking when fully paid
            updateData.status = 'confirmed';
        }
        
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const message = paymentStatus === 'paid' 
            ? 'Payment confirmed! Booking auto-confirmed.' 
            : `Payment status updated to ${paymentStatus}`;
        
        res.json({
            success: true,
            message,
            booking
        });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status'
        });
    }
});

// ===================================
// Record Check-in/Check-out Time (Admin)
// ===================================

router.put('/:id/checkin-checkout', isAdmin, async (req, res) => {
    try {
        const { action } = req.body;
        
        if (!['checkin', 'checkout'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "checkin" or "checkout".'
            });
        }
        
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const now = new Date();
        let updateData = { updatedAt: now };
        let message = '';
        
        if (action === 'checkin') {
            if (booking.actualCheckIn) {
                return res.status(400).json({
                    success: false,
                    message: 'Guest has already checked in'
                });
            }
            updateData.actualCheckIn = now;
            updateData.status = 'confirmed'; // Ensure status is confirmed on check-in
            message = `Guest checked in at ${now.toLocaleString('en-IN')}`;
        } else if (action === 'checkout') {
            if (!booking.actualCheckIn) {
                return res.status(400).json({
                    success: false,
                    message: 'Guest has not checked in yet'
                });
            }
            if (booking.actualCheckOut) {
                return res.status(400).json({
                    success: false,
                    message: 'Guest has already checked out'
                });
            }
            updateData.actualCheckOut = now;
            updateData.status = 'completed'; // Auto-complete booking on checkout
            message = `Guest checked out at ${now.toLocaleString('en-IN')}`;
        }
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json({
            success: true,
            message,
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Check-in/out error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording check-in/check-out'
        });
    }
});

// ===================================
// Extend Booking Stay (Admin)
// ===================================

router.put('/:id/extend', isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        if (!booking.actualCheckIn) {
            return res.status(400).json({
                success: false,
                message: 'Guest must check in before extending stay'
            });
        }
        
        if (booking.actualCheckOut) {
            return res.status(400).json({
                success: false,
                message: 'Cannot extend - guest has already checked out'
            });
        }
        
        // Store original checkout if this is the first extension
        const updateData = {
            updatedAt: Date.now()
        };
        
        if (!booking.originalCheckOut) {
            updateData.originalCheckOut = booking.checkOut;
        }
        
        // Extend checkout by 1 day
        const currentCheckOut = new Date(booking.checkOut);
        currentCheckOut.setDate(currentCheckOut.getDate() + 1);
        updateData.checkOut = currentCheckOut;
        updateData.extendedBy = (booking.extendedBy || 0) + 1;
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json({
            success: true,
            message: `Stay extended by 1 day. New checkout: ${currentCheckOut.toLocaleDateString('en-IN')}`,
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Extend booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error extending booking'
        });
    }
});

// ===================================
// Archive Booking (Admin)
// ===================================

router.put('/:id/archive', isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Booking archived successfully',
            booking
        });
    } catch (error) {
        console.error('Archive booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error archiving booking'
        });
    }
});

// ===================================
// Unarchive Booking (Admin)
// ===================================

router.put('/:id/unarchive', isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { isArchived: false, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Booking unarchived successfully',
            booking
        });
    } catch (error) {
        console.error('Unarchive booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unarchiving booking'
        });
    }
});

module.exports = router;
