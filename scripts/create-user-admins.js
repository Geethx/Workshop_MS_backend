const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// User-admin accounts to create
const userAdmins = [
  { name: "Supun", password: "Supun123", role: "user-admin" },
  { name: "Jeewan", password: "Jeewan123", role: "user-admin" }
];

async function createUserAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const userAdmin of userAdmins) {
      // Check if user already exists
      const existingUser = await User.findOne({ name: userAdmin.name });
      
      if (existingUser) {
        console.log(`⚠️  User "${userAdmin.name}" already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userAdmin.password, 10);

      // Create user-admin
      const newUser = new User({
        name: userAdmin.name,
        password: hashedPassword,
        role: userAdmin.role,
        isActive: true,
        email: undefined
      });

      await newUser.save();
      console.log(`✅ Created user-admin: ${userAdmin.name}`);
    }

    console.log('\n✅ All user-admin accounts created successfully!');
    console.log('\nUser-Admin Credentials:');
    console.log('========================');
    userAdmins.forEach(admin => {
      console.log(`Name: ${admin.name}`);
      console.log(`Password: ${admin.password}`);
      console.log(`Role: ${admin.role}`);
      console.log('------------------------');
    });
    console.log('\nThese users can ONLY manage other users (create/edit/delete staff and viewer accounts).');
    console.log('They CANNOT add items, edit items, delete items, or perform check-in/check-out operations.');

  } catch (error) {
    console.error('❌ Error creating user-admins:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

createUserAdmins();
