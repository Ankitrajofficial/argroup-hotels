// ===================================
// Hotel Ortus - Authentication Server
// ===================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const bookingRoutes = require('./routes/booking');
const settingsRoutes = require('./routes/settings');
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');

const app = express();

// ===================================
// Middleware Configuration
// ===================================

// CORS - Allow requests from frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://10.219.149.57:3000'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Serve static files (your existing frontend)
app.use(express.static(path.join(__dirname)));

// ===================================
// API Routes
// ===================================

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);

// ===================================
// Health Check Endpoint
// ===================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Hotel Ortus Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===================================
// Serve Frontend for All Other Routes
// ===================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===================================
// Error Handling Middleware
// ===================================

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===================================
// Auto Check-out Scheduler
// ===================================

const Booking = require('./models/Booking');

function startAutoCheckoutScheduler() {
    console.log('⏰ Auto-checkout scheduler started');
    
    // Check every minute for bookings that need auto-checkout
    setInterval(async () => {
        try {
            const now = new Date();
            
            // Find bookings where:
            // - actualCheckIn is recorded (guest checked in)
            // - actualCheckOut is NOT recorded (guest hasn't checked out)
            // - checkOut date + 11:00 AM has passed
            
            const bookings = await Booking.find({
                actualCheckIn: { $exists: true, $ne: null },
                actualCheckOut: { $exists: false },
                status: { $in: ['pending', 'confirmed'] }
            });
            
            for (const booking of bookings) {
                const checkOutDate = new Date(booking.checkOut);
                checkOutDate.setHours(11, 0, 0, 0); // 11:00 AM on checkout day
                
                if (now >= checkOutDate) {
                    // Auto-checkout this booking
                    await Booking.findByIdAndUpdate(booking._id, {
                        actualCheckOut: now,
                        status: 'completed',
                        adminNotes: (booking.adminNotes || '') + `\n[Auto-checkout at ${now.toLocaleString('en-IN')}]`,
                        updatedAt: now
                    });
                    
                    console.log(`✅ Auto-checkout: ${booking.name} (Room: ${booking.roomType})`);
                }
            }
        } catch (error) {
            console.error('Auto-checkout scheduler error:', error);
        }
    }, 60000); // Check every minute (60000ms)
}

// ===================================
// Database Connection & Server Start
// ===================================

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
        
        // Start server after DB connection
        app.listen(PORT, () => {
            console.log(`🚀 Hotel Ortus Server running on http://localhost:${PORT}`);
            console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
            
            // Start auto-checkout scheduler
            startAutoCheckoutScheduler();
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('\n📝 Make sure to:');
        console.log('   1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas');
        console.log('   2. Create a cluster and get your connection string');
        console.log('   3. Update MONGODB_URI in your .env file');
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
