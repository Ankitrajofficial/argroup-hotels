const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
}

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            await mongoose.connection.close();
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`\nSuccess! User ${user.name} (${user.email}) is now an Admin.`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error updating user:', error);
        process.exit(1);
    }
};

makeAdmin();
