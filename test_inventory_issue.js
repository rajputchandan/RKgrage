// Test script to reproduce the inventory issue
const mongoose = require('mongoose');
const JobCard = require('./server/model/jobcard');
const Part = require('./server/model/parts');
const Customer = require('./server/model/customer');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/garage_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testInventoryIssue() {
  try {
    console.log('🧪 Testing inventory management issue...\n');

    // Create a test customer
    const testCustomer = new Customer({
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      vehicle_info: 'Test Vehicle'
    });
    await testCustomer.save();
    console.log('✅ Test customer created');

    // Create a test part with initial stock
    const testPart = new Part({
      name: 'Test Brake Pad',
      part_number: 'BP001',
      category: 'Brake System',
      stock_quantity: 10,
      selling_price: 500,
      gst_rate: 18,
      gst_amount: 90,
      supplier: 'Test Supplier',
      min_stock_level: 2
    });
    await testPart.save();
    console.log(`✅ Test part created with stock: ${testPart.stock_quantity}`);

    // Create a job card with 2 parts
    const jobCard = new JobCard({
      customer_id: testCustomer._id,
      customer_name: `${testCustomer.first_name} ${testCustomer.last_name}`,
      customer_phone: testCustomer.phone,
      vehicle_info: testCustomer.vehicle_info,
      service_type: 'Brake Service',
      complaint: 'Brake pads need replacement',
      parts_used: [{
        part_id: testPart._id,
        part_name: testPart.name,
        part_number: testPart.part_number,
        quantity: 2,
        unit_price: testPart.selling_price,
        total_price: testPart.selling_price * 2
      }],
      labor_entries: [{
        labor_type: 'Brake Pad Installation',
        total_amount: 300
      }]
    });
    await jobCard.save();

    // Reduce stock as per create logic
    await Part.findByIdAndUpdate(
      testPart._id,
      { $inc: { stock_quantity: -2 } }
    );

    const partAfterCreate = await Part.findById(testPart._id);
    console.log(`✅ Job card created, part stock after creation: ${partAfterCreate.stock_quantity}`);

    // Now simulate an update - change quantity from 2 to 3
    console.log('\n🔄 Simulating job card update (quantity 2 → 3)...');
    
    const updateData = {
      parts_used: [{
        part_id: testPart._id,
        part_name: testPart.name,
        part_number: testPart.part_number,
        quantity: 3, // Changed from 2 to 3
        unit_price: testPart.selling_price,
        total_price: testPart.selling_price * 3
      }]
    };

    // Get existing job card
    const existingJobCard = await JobCard.findById(jobCard._id);
    
    // Simulate the update logic from the controller
    const existingPartsMap = new Map();
    existingJobCard.parts_used.forEach(part => {
      const key = part.part_id.toString();
      existingPartsMap.set(key, part.quantity);
    });

    const newPartsMap = new Map();
    updateData.parts_used.forEach(partItem => {
      const key = partItem.part_id.toString();
      newPartsMap.set(key, (newPartsMap.get(key) || 0) + partItem.quantity);
    });

    // Calculate inventory changes
    const inventoryChanges = new Map();
    
    // Check existing parts
    existingPartsMap.forEach((oldQty, partId) => {
      const newQty = newPartsMap.get(partId) || 0;
      const difference = newQty - oldQty;
      if (difference !== 0) {
        inventoryChanges.set(partId, difference);
      }
    });

    // Check new parts
    newPartsMap.forEach((newQty, partId) => {
      if (!existingPartsMap.has(partId)) {
        inventoryChanges.set(partId, newQty);
      }
    });

    console.log('📊 Inventory changes calculated:');
    inventoryChanges.forEach((change, partId) => {
      console.log(`   Part ${partId}: ${change > 0 ? '+' : ''}${change}`);
    });

    // Apply inventory changes
    for (let [partId, qtyChange] of inventoryChanges) {
      await Part.findByIdAndUpdate(
        partId,
        { $inc: { stock_quantity: -qtyChange } }
      );
      console.log(`   Applied change: ${-qtyChange} to part ${partId}`);
    }

    const partAfterUpdate = await Part.findById(testPart._id);
    console.log(`✅ Part stock after update: ${partAfterUpdate.stock_quantity}`);

    // Expected: 10 (initial) - 2 (create) - 1 (update difference) = 7
    const expectedStock = 7;
    if (partAfterUpdate.stock_quantity === expectedStock) {
      console.log('✅ Inventory management working correctly!');
    } else {
      console.log(`❌ Inventory issue detected! Expected: ${expectedStock}, Actual: ${partAfterUpdate.stock_quantity}`);
    }

    // Cleanup
    await JobCard.findByIdAndDelete(jobCard._id);
    await Part.findByIdAndDelete(testPart._id);
    await Customer.findByIdAndDelete(testCustomer._id);
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testInventoryIssue();