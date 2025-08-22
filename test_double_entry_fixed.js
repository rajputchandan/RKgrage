// Test script to verify the double entry fix
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
    
    // Create test part with limited stock
    const partResponse = await axios.post(`${BASE_URL}/parts/add`, {
      name: 'Engine Oil Fixed',
      part_number: 'EO001-FIXED',
      category: 'Engine',
      stock_quantity: 5,
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

async function testDoubleEntryFixed() {
  try {
    console.log('\n🧪 Testing double entry fix...');
    
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
    
    // Step 2: Try to update with duplicate entries (this should now work correctly)
    console.log('\n🔄 Step 2: Updating with duplicate entries (should now handle correctly)...');
    console.log('Sending duplicate part entries - system should use latest quantity only...');
    
    try {
      const updateResponse = await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
        parts_used: [
          {
            part_id: testPartId,
            quantity: 3
          },
          {
            part_id: testPartId,
            quantity: 3  // Duplicate entry - should be handled correctly now
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Update succeeded - duplicate entries handled correctly');
      
      const stockAfterUpdate = await getPartStock();
      console.log(`📦 Stock after update: ${stockAfterUpdate} (should still be ${stockAfterCreation})`);
      
      if (stockAfterUpdate === stockAfterCreation) {
        console.log('✅ FIXED: No additional inventory consumed due to duplicate entries');
        return true;
      } else {
        console.log('❌ ISSUE PERSISTS: Additional inventory was consumed');
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

async function runFixedTest() {
  console.log('🚀 Starting double entry fix verification test...\n');
  
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
  
  const fixWorking = await testDoubleEntryFixed();
  
  await cleanup();
  
  if (fixWorking) {
    console.log('\n🎉 DOUBLE ENTRY ISSUE FIXED!');
    console.log('📋 Solution implemented:');
    console.log('   ✅ Duplicate parts are now detected and handled correctly');
    console.log('   ✅ Latest quantity is used instead of accumulating duplicates');
    console.log('   ✅ No additional inventory consumed due to duplicate entries');
  } else {
    console.log('\n❌ Double entry issue still exists or new problems introduced');
  }
}

// Run the test
runFixedTest().catch(console.error);