// Test script to verify the jobcard update fix
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
let testCustomerId = null;
let testPartId = null;
let testJobCardId = null;
let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@garage.com',
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
    const customerResponse = await axios.post(`${BASE_URL}/customers/create`, {
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      vehicle_info: 'Test Vehicle 2024'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testCustomerId = customerResponse.data.data._id;
    console.log('✅ Test customer created:', testCustomerId);
    
    // Create test part
    const partResponse = await axios.post(`${BASE_URL}/parts/create`, {
      name: 'Test Brake Pad Fix',
      part_number: 'BP001-FIX',
      category: 'Brake System',
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

async function testJobCardUpdateFix() {
  try {
    console.log('\n🧪 Testing jobcard update fix...');
    
    // Step 1: Create job card with 2 parts
    console.log('\n🔨 Creating job card with 2 parts...');
    const jobCardResponse = await axios.post(`${BASE_URL}/jobcards/create`, {
      customer_id: testCustomerId,
      service_type: 'Brake Service',
      complaint: 'Brake pads need replacement',
      parts_used: [{
        part_id: testPartId,
        quantity: 2
      }],
      labor_entries: [{
        labor_type: 'Brake Pad Installation',
        total_amount: 300
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testJobCardId = jobCardResponse.data.data._id;
    console.log('✅ Job card created:', testJobCardId);
    
    // Check initial stock
    const initialStockResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const initialStock = initialStockResponse.data.data.stock_quantity;
    console.log(`📦 Stock after creation: ${initialStock} (should be 18)`);
    
    // Step 2: Update job card general info (should NOT affect inventory)
    console.log('\n🔄 Updating job card general info (should not affect inventory)...');
    await axios.put(`${BASE_URL}/jobcards/update/${testJobCardId}`, {
      notes: 'Updated notes - this should not affect inventory',
      mechanic_assigned: 'John Doe'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Check stock after general update
    const afterGeneralUpdateResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stockAfterGeneralUpdate = afterGeneralUpdateResponse.data.data.stock_quantity;
    console.log(`📦 Stock after general update: ${stockAfterGeneralUpdate} (should still be 18)`);
    
    if (stockAfterGeneralUpdate !== initialStock) {
      console.log('❌ FAILED: General update affected inventory!');
      return false;
    }
    
    // Step 3: Update parts using new endpoint (change quantity from 2 to 3)
    console.log('\n🔄 Updating parts (2 → 3) using new endpoint...');
    await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
      parts_used: [{
        part_id: testPartId,
        quantity: 3
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Check stock after parts update
    const afterPartsUpdateResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stockAfterPartsUpdate = afterPartsUpdateResponse.data.data.stock_quantity;
    console.log(`📦 Stock after parts update: ${stockAfterPartsUpdate} (should be 17)`);
    
    if (stockAfterPartsUpdate !== 17) {
      console.log('❌ FAILED: Parts update did not work correctly!');
      return false;
    }
    
    // Step 4: Update parts again (3 → 1) to test reduction
    console.log('\n🔄 Updating parts (3 → 1) to test stock restoration...');
    await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
      parts_used: [{
        part_id: testPartId,
        quantity: 1
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Check final stock
    const finalStockResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const finalStock = finalStockResponse.data.data.stock_quantity;
    console.log(`📦 Final stock: ${finalStock} (should be 19)`);
    
    if (finalStock !== 19) {
      console.log('❌ FAILED: Stock restoration did not work correctly!');
      return false;
    }
    
    console.log('\n🎉 All tests passed! The jobcard update fix is working correctly.');
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
    }
    
    if (testPartId) {
      await axios.delete(`${BASE_URL}/parts/delete/${testPartId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
    
    if (testCustomerId) {
      await axios.delete(`${BASE_URL}/customers/delete/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting jobcard update fix tests...\n');
  
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
  
  const testsPassed = await testJobCardUpdateFix();
  
  await cleanup();
  
  if (testsPassed) {
    console.log('\n✅ ALL TESTS PASSED! The jobcard update fix is working correctly.');
    console.log('📋 Summary:');
    console.log('   - ObjectId casting error fixed');
    console.log('   - General updates do not affect inventory');
    console.log('   - Parts updates properly manage inventory');
    console.log('   - Stock is correctly restored when parts are reduced');
  } else {
    console.log('\n❌ TESTS FAILED! There are still issues with the jobcard update.');
  }
}

// Run the tests
runTests().catch(console.error);