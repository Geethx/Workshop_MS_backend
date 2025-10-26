// Script to set up MongoDB Atlas database with proper indexes
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function setupAtlasDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Replace <db_password> placeholder with actual password
    if (MONGODB_URI.includes('<db_password>')) {
      console.error('❌ ERROR: Please replace <db_password> in your .env file with your actual database password!');
      console.log('\n📝 Steps to fix:');
      console.log('1. Open backend/.env file');
      console.log('2. Replace <db_password> with your actual MongoDB Atlas password');
      console.log('3. Save the file and run this script again');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully!');

    const db = mongoose.connection.db;

    // Create users collection with indexes
    console.log('\n📦 Setting up Users collection...');
    const usersCollection = db.collection('users');
    
    // Drop all existing indexes (except _id)
    try {
      const existingIndexes = await usersCollection.indexes();
      for (const index of existingIndexes) {
        if (index.name !== '_id_') {
          await usersCollection.dropIndex(index.name);
          console.log(`   Dropped index: ${index.name}`);
        }
      }
    } catch (err) {
      console.log('   No existing indexes to drop');
    }

    // Create required indexes
    await usersCollection.createIndex({ name: 1 }, { unique: true, background: true });
    console.log('   ✅ Created unique index on: name');

    // Create items collection with indexes
    console.log('\n📦 Setting up Items collection...');
    const itemsCollection = db.collection('items');
    
    try {
      const existingIndexes = await itemsCollection.indexes();
      for (const index of existingIndexes) {
        if (index.name !== '_id_') {
          await itemsCollection.dropIndex(index.name);
          console.log(`   Dropped index: ${index.name}`);
        }
      }
    } catch (err) {
      console.log('   No existing indexes to drop');
    }

    await itemsCollection.createIndex({ code: 1 }, { unique: true, background: true });
    console.log('   ✅ Created unique index on: code');
    
    await itemsCollection.createIndex({ name: 1 }, { background: true });
    console.log('   ✅ Created index on: name');
    
    await itemsCollection.createIndex({ category: 1 }, { background: true });
    console.log('   ✅ Created index on: category');
    
    await itemsCollection.createIndex({ status: 1 }, { background: true });
    console.log('   ✅ Created index on: status');

    // Create transactions collection with indexes
    console.log('\n📦 Setting up Transactions collection...');
    const transactionsCollection = db.collection('transactions');
    
    try {
      const existingIndexes = await transactionsCollection.indexes();
      for (const index of existingIndexes) {
        if (index.name !== '_id_') {
          await transactionsCollection.dropIndex(index.name);
          console.log(`   Dropped index: ${index.name}`);
        }
      }
    } catch (err) {
      console.log('   No existing indexes to drop');
    }

    await transactionsCollection.createIndex({ item: 1 }, { background: true });
    console.log('   ✅ Created index on: item');
    
    await transactionsCollection.createIndex({ createdAt: -1 }, { background: true });
    console.log('   ✅ Created index on: createdAt');

    // Display collection stats
    console.log('\n📊 Database Statistics:');
    const stats = await db.stats();
    console.log(`   Database: ${db.databaseName}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Indexes: ${stats.indexes}`);

    // Count documents in each collection
    const usersCount = await usersCollection.countDocuments();
    const itemsCount = await itemsCollection.countDocuments();
    const transactionsCount = await transactionsCollection.countDocuments();

    console.log('\n📈 Document Counts:');
    console.log(`   Users: ${usersCount}`);
    console.log(`   Items: ${itemsCount}`);
    console.log(`   Transactions: ${transactionsCount}`);

    console.log('\n✅ MongoDB Atlas database setup complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Create admin users using Postman (see CREATE_ADMIN_USERS.md)');
    console.log('2. Restart your backend server: npm start');
    console.log('3. Login and start using the system');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Error Solutions:');
      console.log('1. Check your username and password are correct');
      console.log('2. Make sure you replaced <db_password> with actual password');
      console.log('3. Verify your IP address is whitelisted in MongoDB Atlas');
      console.log('4. Check if database user has proper permissions');
    }
    
    if (error.message.includes('network')) {
      console.log('\n💡 Network Error Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Check if firewall is blocking the connection');
    }

    process.exit(1);
  }
}

setupAtlasDatabase();
