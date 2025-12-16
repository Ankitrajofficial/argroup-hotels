const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testUser = new User({
            name: 'Delete Me',
            email: 'deleteme@example.com',
            password: 'password123',
            phone: '0000000000',
            role: 'user'
        });

        await testUser.save();
        console.log('Test user created:', testUser._id);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};

createTestUser();
