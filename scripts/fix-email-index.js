// Script to remove the unique index on email field
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workshop-inventory';

async function fixEmailIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the email unique index if it exists
    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ Successfully dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  email_1 index does not exist (already removed)');
      } else {
        console.error('Error dropping email_1 index:', error.message);
      }
    }

    // Verify remaining indexes
    const remainingIndexes = await usersCollection.indexes();
    console.log('Remaining indexes:', remainingIndexes);

    console.log('✅ Email index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixEmailIndex();
