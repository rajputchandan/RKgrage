// Test file to check database connection and authentication issues
const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection
const testDatabaseConnection = async () => {
  try {
    console.log('🔗 Testing database connection...');
    console.log('📍 Database URL:', process.env.MONGOURL);
    
    await mongoose.connect(process.env.MONGOURL);
    console.log('✅ Database connected successfully!');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Test parts collection specifically
    const Part = require('./model/parts');
    const partCount = await Part.countDocuments();
    console.log(`\n📦 Parts collection: ${partCount} documents`);
    
    // Test customers collection
    const Customer = require('./model/customer');
    const customerCount = await Customer.countDocuments();
    console.log(`👥 Customers collection: ${customerCount} documents`);
    
    // Test billing collection
    const Billing = require('./model/billing');
    const billingCount = await Billing.countDocuments();
    console.log(`💰 Billing collection: ${billingCount} documents`);
    
    // Get sample data from each collection
    console.log('\n📋 Sample data:');
    
    const sampleParts = await Part.find().limit(3).select('name part_number stock_quantity');
    console.log('Parts:', sampleParts.map(p => ({ name: p.name, part_number: p.part_number, stock: p.stock_quantity })));
    
    const sampleCustomers = await Customer.find().limit(3).select('first_name last_name phone');
    console.log('Customers:', sampleCustomers.map(c => ({ name: `${c.first_name} ${c.last_name}`, phone: c.phone })));
    
    const sampleBills = await Billing.find().limit(3).select('invoice_number total_amount payment_status');
    console.log('Bills:', sampleBills.map(b => ({ invoice: b.invoice_number, total: b.total_amount, status: b.payment_status })));
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
};

// Test JWT token validation
const testJWTValidation = () => {
  const jwt = require('jsonwebtoken');
  
  console.log('\n🔐 Testing JWT configuration...');
  console.log('Secret Key:', process.env.SECRETKEY ? 'Set' : 'Not Set');
  console.log('Admin Email:', process.env.AdminEmail);
  console.log('Admin Password:', process.env.AdminPassword ? 'Set' : 'Not Set');
  
  try {
    // Create a test token
    const testToken = jwt.sign(
      { username: 'test', role: 'admin' },
      process.env.SECRETKEY,
      { expiresIn: '1d' }
    );
    
    console.log('✅ JWT token creation successful');
    
    // Verify the token
    const decoded = jwt.verify(testToken, process.env.SECRETKEY);
    console.log('✅ JWT token verification successful:', decoded);
    
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🧪 Starting Database and Authentication Tests');
  console.log('==============================================');
  
  await testDatabaseConnection();
  testJWTValidation();
  
  console.log('\n✅ Tests completed!');
  process.exit(0);
};

runTests();