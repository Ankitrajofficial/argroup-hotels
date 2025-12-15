const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@oratus.com';
        const adminPass = 'admin123';
        const adminName = 'Oratus Admin';
        const adminPhone = '1234567890';

        // Check if admin exists
        const exists = await User.findOne({ email: adminEmail });
        
        if (exists) {
            console.log('Admin user already exists.');
            // Update role to be sure
            exists.role = 'admin';
            await exists.save();
            console.log('Ensure role is set to admin.');
        } else {
            const admin = new User({
                name: adminName,
                email: adminEmail,
                password: adminPass, // Will be hashed by pre-save hook
                phone: adminPhone,
                role: 'admin'
            });

            await admin.save();
            console.log('Admin user created successfully.');
        }

        console.log(`
        =========================================
        LOGIN CREDENTIALS:
        Email: ${adminEmail}
        Password: ${adminPass}
        =========================================
        `);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
