// Comprehensive test script for jobcard functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

// Test data
let testCustomerId = null;
let testPartId = null;
let testJobCardId = null;
let authToken = null;

async function login() {
  try {
    console.log('🔐 Attempting login...');
    const response = await axios.post(`${BASE_URL}/admin/admin/login`, {
      username: 'admin@gmail.com',
      password: 'admin123'
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    
    // Admin credentials are fixed in .env file, no need to create user
    console.log('❌ Please check if server is running and credentials are correct');
    console.log('Expected: username=admin@gmail.com, password=admin123');
    
    return false;
  }
}

async function createTestData() {
  try {
    console.log('\n📝 Creating test data...');
    
    // Create test customer
    const customerResponse = await axios.post(`${BASE_URL}/customers/add`, {
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      zip_code: '12345',
      vehicle_info: 'Test Vehicle 2024'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testCustomerId = customerResponse.data.data._id;
    console.log('✅ Test customer created:', testCustomerId);
    
    // Create test part with good stock
    const partResponse = await axios.post(`${BASE_URL}/parts/add`, {
      name: 'Test Brake Pad',
      part_number: 'BP001-TEST',
      category: 'Brake System',
      stock_quantity: 50,
      selling_price: 500,
      gst_rate: 18,
      supplier: 'Test Supplier',
      min_stock_level: 5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testPartId = partResponse.data.data._id;
    console.log('✅ Test part created:', testPartId, 'with stock:', partResponse.data.data.stock_quantity);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to create test data:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getPartStock() {
  try {
    const response = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data.data.stock_quantity;
  } catch (error) {
    console.log('❌ Failed to get part stock:', error.message);
    return null;
  }
}

async function testJobCardFlow() {
  try {
    console.log('\n🧪 Testing complete jobcard flow...');
    
    // Step 1: Create job card with 5 parts
    console.log('\n🔨 Step 1: Creating job card with 5 parts...');
    const initialStock = await getPartStock();
    console.log(`📦 Initial stock: ${initialStock}`);
    
    const jobCardResponse = await axios.post(`${BASE_URL}/jobcards/create`, {
      customer_id: testCustomerId,
      service_type: 'Brake Service',
      complaint: 'Brake pads need replacement',
      parts_used: [{
        part_id: testPartId,
        quantity: 5
      }],
      labor_entries: [{
        labor_type: 'Brake Pad Installation',
        total_amount: 300
      }],
      notes: 'Initial job card creation'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testJobCardId = jobCardResponse.data.data._id;
    console.log('✅ Job card created:', testJobCardId);
    
    const stockAfterCreation = await getPartStock();
    console.log(`📦 Stock after creation: ${stockAfterCreation} (should be ${initialStock - 5})`);
    
    if (stockAfterCreation !== initialStock - 5) {
      console.log('❌ FAILED: Stock not properly reduced during creation!');
      return false;
    }
    
    // Step 2: Update 1 - General update (should NOT affect inventory)
    console.log('\n🔄 Step 2: Update 1 - General info update (should not affect inventory)...');
    await axios.put(`${BASE_URL}/jobcards/update/${testJobCardId}`, {
      notes: 'Updated notes - first update',
      mechanic_assigned: 'John Doe',
      status: 'In Progress'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const stockAfterUpdate1 = await getPartStock();
    console.log(`📦 Stock after update 1: ${stockAfterUpdate1} (should still be ${stockAfterCreation})`);
    
    if (stockAfterUpdate1 !== stockAfterCreation) {
      console.log('❌ FAILED: General update affected inventory!');
      return false;
    }
    console.log('✅ Update 1 successful - inventory unchanged');
    
    // Step 3: Update 2 - Parts update (5 → 8 parts)
    console.log('\n🔄 Step 3: Update 2 - Parts update (5 → 8 parts)...');
    await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
      parts_used: [{
        part_id: testPartId,
        quantity: 8
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const stockAfterUpdate2 = await getPartStock();
    console.log(`📦 Stock after update 2: ${stockAfterUpdate2} (should be ${stockAfterUpdate1 - 3})`);
    
    if (stockAfterUpdate2 !== stockAfterUpdate1 - 3) {
      console.log('❌ FAILED: Parts update did not work correctly!');
      return false;
    }
    console.log('✅ Update 2 successful - inventory properly reduced');
    
    // Step 4: Update 3 - Parts reduction (8 → 3 parts)
    console.log('\n🔄 Step 4: Update 3 - Parts reduction (8 → 3 parts)...');
    await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
      parts_used: [{
        part_id: testPartId,
        quantity: 3
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const stockAfterUpdate3 = await getPartStock();
    console.log(`📦 Stock after update 3: ${stockAfterUpdate3} (should be ${stockAfterUpdate2 + 5})`);
    
    if (stockAfterUpdate3 !== stockAfterUpdate2 + 5) {
      console.log('❌ FAILED: Stock restoration did not work correctly!');
      return false;
    }
    console.log('✅ Update 3 successful - inventory properly restored');
    
    // Step 5: Final status update
    console.log('\n🔄 Step 5: Final status update...');
    await axios.put(`${BASE_URL}/jobcards/update/${testJobCardId}`, {
      status: 'Completed',
      notes: 'Job completed successfully'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const finalStock = await getPartStock();
    console.log(`📦 Final stock: ${finalStock} (should still be ${stockAfterUpdate3})`);
    
    if (finalStock !== stockAfterUpdate3) {
      console.log('❌ FAILED: Final update affected inventory!');
      return false;
    }
    console.log('✅ Final update successful - inventory unchanged');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Initial stock: ${initialStock}`);
    console.log(`   After creation (5 parts used): ${stockAfterCreation}`);
    console.log(`   After update 1 (general): ${stockAfterUpdate1}`);
    console.log(`   After update 2 (8 parts): ${stockAfterUpdate2}`);
    console.log(`   After update 3 (3 parts): ${stockAfterUpdate3}`);
    console.log(`   Final stock: ${finalStock}`);
    console.log(`   Total parts consumed: ${initialStock - finalStock} (should be 3)`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    if (testJobCardId) {
      await axios.delete(`${BASE_URL}/jobcards/delete/${testJobCardId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Job card deleted');
    }
    
    if (testPartId) {
      await axios.delete(`${BASE_URL}/parts/delete/${testPartId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test part deleted');
    }
    
    if (testCustomerId) {
      await axios.delete(`${BASE_URL}/customers/delete/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test customer deleted');
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.response?.data?.message || error.message);
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive jobcard functionality test...\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('💥 Cannot proceed without login');
    return;
  }
  
  const testDataCreated = await createTestData();
  if (!testDataCreated) {
    console.log('💥 Cannot proceed without test data');
    return;
  }
  
  const testsPassed = await testJobCardFlow();
  
  await cleanup();
  
  if (testsPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Jobcard functionality is working correctly.');
    console.log('📋 Verified:');
    console.log('   ✅ Job card creation with parts inventory reduction');
    console.log('   ✅ General updates do not affect inventory');
    console.log('   ✅ Parts updates properly manage inventory');
    console.log('   ✅ Stock is correctly restored when parts are reduced');
    console.log('   ✅ Multiple updates work correctly');
  } else {
    console.log('\n❌ TESTS FAILED! There are issues with the jobcard functionality.');
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);