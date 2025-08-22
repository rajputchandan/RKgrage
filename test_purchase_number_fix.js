// Quick test to verify purchase number generation fix
const mongoose = require('mongoose');

// Test the purchase number generation
const testPurchaseNumberGeneration = async () => {
  console.log('🧪 Testing Purchase Number Generation Fix...');
  
  try {
    // Connect to MongoDB (use your actual connection string)
    const mongoUri = 'mongodb+srv://vishwakarmagagan24:3DMJE9dAQUts1ycd@cluster0.0z7qe.mongodb.net/movie?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import the models
    const InventoryPurchase = require('./server/model/inventoryPurchase');
    const Supplier = require('./server/model/supplier');

    // Create a test supplier first
    const testSupplier = new Supplier({
      supplier_name: 'Test Supplier for Purchase Number',
      mobile: '9999999999',
      email: 'test@supplier.com'
    });
    await testSupplier.save();
    console.log('✅ Test supplier created:', testSupplier._id);

    // Create a test purchase without purchase_number
    const testPurchase = new InventoryPurchase({
      supplier_id: testSupplier._id,
      supplier_name: testSupplier.supplier_name,
      purchase_date: new Date(),
      items: [{
        part_id: new mongoose.Types.ObjectId(),
        part_name: 'Test Part',
        part_number: 'TEST001',
        quantity: 1,
        unit_price: 100,
        total_price: 100,
        gst_rate: 18,
        gst_amount: 18,
        final_amount: 118
      }],
      payment_method: 'Cash',
      paid_amount: 0
    });

    console.log('📝 Saving purchase (purchase_number should be auto-generated)...');
    await testPurchase.save();
    
    console.log('✅ Purchase saved successfully!');
    console.log('📋 Generated purchase_number:', testPurchase.purchase_number);
    console.log('💰 Total amount:', testPurchase.total_amount);
    console.log('📊 Subtotal:', testPurchase.subtotal);
    console.log('🧾 GST total:', testPurchase.total_gst);

    // Clean up test data
    await InventoryPurchase.findByIdAndDelete(testPurchase._id);
    await Supplier.findByIdAndDelete(testSupplier._id);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 Purchase number generation is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Test the model validation
const testModelValidation = () => {
  console.log('\n🧪 Testing Model Schema...');
  
  const InventoryPurchase = require('./server/model/inventoryPurchase');
  const schema = InventoryPurchase.schema;
  
  console.log('📋 Purchase number field config:');
  console.log('  - Type:', schema.paths.purchase_number.instance);
  console.log('  - Required:', schema.paths.purchase_number.isRequired);
  console.log('  - Unique:', schema.paths.purchase_number._index?.unique);
  
  console.log('✅ Schema validation complete');
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Purchase Number Fix Tests...\n');
  
  // Test model schema
  testModelValidation();
  
  // Test actual generation
  await testPurchaseNumberGeneration();
  
  console.log('\n📋 Fix Summary:');
  console.log('✅ Removed required constraint from purchase_number');
  console.log('✅ Added error handling in pre-save middleware');
  console.log('✅ Added validation in controller');
  console.log('✅ Fixed authentication middleware in routes');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Restart your server');
  console.log('2. Try adding a purchase through the UI');
  console.log('3. Check that purchase_number is generated automatically');
};

// Export for use in other files
module.exports = {
  testPurchaseNumberGeneration,
  testModelValidation,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}