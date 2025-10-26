// Quick test to verify MongoDB Atlas connection
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');

  const MONGODB_URI = process.env.MONGODB_URI;

  // Check if password was replaced
  if (MONGODB_URI.includes('<db_password>')) {
    console.error('❌ ERROR: Password not updated!');
    console.log('\n📝 To fix:');
    console.log('1. Open backend/.env');
    console.log('2. Replace <db_password> with your actual password');
    console.log('3. Save and run this test again\n');
    process.exit(1);
  }

  try {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ SUCCESS! Connected to MongoDB Atlas\n');
    
    console.log('📊 Connection Details:');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port || 'N/A (using SRV)'}`);
    console.log(`   Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}\n`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📦 Collections (${collections.length}):`);
    if (collections.length > 0) {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   (No collections yet - this is normal for a new database)');
    }

    console.log('\n✅ Connection test passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: node scripts/setup-atlas-database.js');
    console.log('2. Create admin users via Postman');
    console.log('3. Start your application\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Error - Possible solutions:');
      console.log('1. Check username is correct: jeewangeethanga_db_user');
      console.log('2. Verify password in .env file');
      console.log('3. URL-encode special characters in password');
      console.log('4. Check database user exists in MongoDB Atlas');
      console.log('5. Verify user has proper permissions\n');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\n💡 Network Error - Possible solutions:');
      console.log('1. Check internet connection');
      console.log('2. Whitelist IP in MongoDB Atlas Network Access');
      console.log('3. Verify cluster is running (not paused)');
      console.log('4. Check firewall settings\n');
    } else {
      console.log('\n💡 General troubleshooting:');
      console.log('1. Verify connection string in .env file');
      console.log('2. Check MongoDB Atlas dashboard for cluster status');
      console.log('3. Review error message above for specific details\n');
    }

    process.exit(1);
  }
}

testConnection();
