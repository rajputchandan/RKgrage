// Test script to verify the additive parts logic
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
      name: 'Engine Oil Additive',
      part_number: 'EO001-ADD',
      category: 'Engine',
      stock_quantity: 20,
      selling_price: 500,
      gst_rate: 18,
      supplier: 'Test Supplier',
      min_stock_level: 2
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

async function getJobCardParts() {
  try {
    const response = await axios.get(`${BASE_URL}/jobcards/${testJobCardId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data.data.parts_used;
  } catch (error) {
    console.log('❌ Failed to get job card parts:', error.message);
    return null;
  }
}

async function testAdditiveLogic() {
  try {
    console.log('\n🧪 Testing additive parts logic...');
    
    // Step 1: Create job card with 3 parts
    console.log('\n🔨 Step 1: Creating job card with 3 Engine Oil...');
    const initialStock = await getPartStock();
    console.log(`📦 Initial stock: ${initialStock}`);
    
    const jobCardResponse = await axios.post(`${BASE_URL}/jobcards/create`, {
      customer_id: testCustomerId,
      service_type: 'Engine Repair',
      complaint: 'Engine oil change needed',
      parts_used: [{
        part_id: testPartId,
        quantity: 3
      }],
      labor_entries: [{
        labor_type: 'Oil Change',
        total_amount: 200
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testJobCardId = jobCardResponse.data.data._id;
    console.log('✅ Job card created:', testJobCardId);
    
    const stockAfterCreation = await getPartStock();
    console.log(`📦 Stock after creation: ${stockAfterCreation} (should be ${initialStock - 3})`);
    
    let jobCardParts = await getJobCardParts();
    console.log(`📋 Job card parts: ${jobCardParts[0].quantity} units`);
    
    // Step 2: Update with duplicate entries that should ADD together
    console.log('\n🔄 Step 2: Adding duplicate entries (3 + 2 = 5 total)...');
    console.log('Sending: 3 units + 2 units = should become 5 units total');
    
    try {
      const updateResponse = await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
        parts_used: [
          {
            part_id: testPartId,
            quantity: 3
          },
          {
            part_id: testPartId,
            quantity: 2  // This should ADD to the first entry
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Update succeeded');
      
      jobCardParts = await getJobCardParts();
      const finalQuantity = jobCardParts[0].quantity;
      console.log(`📋 Final job card parts: ${finalQuantity} units`);
      
      const stockAfterUpdate = await getPartStock();
      console.log(`📦 Stock after update: ${stockAfterUpdate}`);
      
      // Expected: 3 original parts were restored, then 5 new parts were consumed
      // So stock should be: initialStock - 3 + 3 - 5 = initialStock - 5
      const expectedStock = initialStock - 5;
      
      if (finalQuantity === 5 && stockAfterUpdate === expectedStock) {
        console.log('✅ ADDITIVE LOGIC WORKING: 3 + 2 = 5 parts correctly');
        console.log(`✅ INVENTORY CORRECT: Stock is ${stockAfterUpdate} (expected ${expectedStock})`);
        return true;
      } else {
        console.log(`❌ ISSUE: Expected 5 parts and stock ${expectedStock}, got ${finalQuantity} parts and stock ${stockAfterUpdate}`);
        return false;
      }
      
    } catch (error) {
      console.log('❌ Update failed:', error.response?.data?.message || error.message);
      return false;
    }
    
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

async function runAdditiveTest() {
  console.log('🚀 Starting additive parts logic test...\n');
  
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
  
  const additiveWorking = await testAdditiveLogic();
  
  await cleanup();
  
  if (additiveWorking) {
    console.log('\n🎉 ADDITIVE LOGIC WORKING CORRECTLY!');
    console.log('📋 Verified:');
    console.log('   ✅ Duplicate parts are added together (3 + 2 = 5)');
    console.log('   ✅ Inventory is properly managed with additive logic');
    console.log('   ✅ No false insufficient stock errors');
  } else {
    console.log('\n❌ Additive logic not working as expected');
  }
}

// Run the test
runAdditiveTest().catch(console.error);