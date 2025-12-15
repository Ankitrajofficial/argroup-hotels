// Script to make a user admin
const mongoose = require('mongoose');
require('dotenv').config();

const email = 'testexample@gmail.com';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: email },
    { $set: { role: 'admin' } }
  );
  
  if (result.modifiedCount > 0) {
    console.log(`✅ Success! ${email} is now an admin.`);
  } else {
    console.log(`⚠️ User not found or already an admin.`);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
