// API Test script to verify inventory management
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
      name: 'Test Brake Pad',
      part_number: 'BP001-TEST',
      category: 'Brake System',
      stock_quantity: 10,
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

async function testInventoryFlow() {
  try {
    console.log('\n🧪 Testing inventory management flow...');
    
    // Step 1: Get initial part stock
    const initialPartResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const initialStock = initialPartResponse.data.data.stock_quantity;
    console.log(`📦 Initial stock: ${initialStock}`);
    
    // Step 2: Create job card with 2 parts
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
    
    // Check stock after creation
    const afterCreateResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stockAfterCreate = afterCreateResponse.data.data.stock_quantity;
    console.log(`📦 Stock after creation: ${stockAfterCreate} (expected: ${initialStock - 2})`);
    
    if (stockAfterCreate !== initialStock - 2) {
      console.log('❌ Stock reduction failed on creation!');
      return false;
    }
    
    // Step 3: Update job card - change quantity from 2 to 3
    console.log('\n🔄 Updating job card - changing quantity from 2 to 3...');
    const updateResponse = await axios.put(`${BASE_URL}/jobcards/update/${testJobCardId}`, {
      parts_used: [{
        part_id: testPartId,
        part_name: 'Test Brake Pad',
        part_number: 'BP001-TEST',
        quantity: 3,
        unit_price: 500,
        total_price: 1500
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Job card updated');
    
    // Check stock after update
    const afterUpdateResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stockAfterUpdate = afterUpdateResponse.data.data.stock_quantity;
    console.log(`📦 Stock after update: ${stockAfterUpdate} (expected: ${initialStock - 3})`);
    
    if (stockAfterUpdate !== initialStock - 3) {
      console.log('❌ Stock update failed! Expected:', initialStock - 3, 'Got:', stockAfterUpdate);
      return false;
    }
    
    // Step 4: Update job card - change quantity from 3 to 1
    console.log('\n🔄 Updating job card - changing quantity from 3 to 1...');
    await axios.put(`${BASE_URL}/jobcards/update/${testJobCardId}`, {
      parts_used: [{
        part_id: testPartId,
        part_name: 'Test Brake Pad',
        part_number: 'BP001-TEST',
        quantity: 1,
        unit_price: 500,
        total_price: 500
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Check stock after second update
    const afterSecondUpdateResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stockAfterSecondUpdate = afterSecondUpdateResponse.data.data.stock_quantity;
    console.log(`📦 Stock after second update: ${stockAfterSecondUpdate} (expected: ${initialStock - 1})`);
    
    if (stockAfterSecondUpdate !== initialStock - 1) {
      console.log('❌ Second stock update failed! Expected:', initialStock - 1, 'Got:', stockAfterSecondUpdate);
      return false;
    }
    
    // Step 5: Delete job card - should restore inventory
    console.log('\n🗑️ Deleting job card - should restore inventory...');
    await axios.delete(`${BASE_URL}/jobcards/delete/${testJobCardId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Check stock after deletion
    const afterDeleteResponse = await axios.get(`${BASE_URL}/parts/${testPartId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stockAfterDelete = afterDeleteResponse.data.data.stock_quantity;
    console.log(`📦 Stock after deletion: ${stockAfterDelete} (expected: ${initialStock})`);
    
    if (stockAfterDelete !== initialStock) {
      console.log('❌ Stock restoration failed! Expected:', initialStock, 'Got:', stockAfterDelete);
      return false;
    }
    
    console.log('\n🎉 All inventory tests passed!');
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
      try {
        await axios.delete(`${BASE_URL}/jobcards/delete/${testJobCardId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (e) {
        // Job card might already be deleted
      }
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
  console.log('🚀 Starting inventory management API tests...\n');
  
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
  
  const testsPassed = await testInventoryFlow();
  
  await cleanup();
  
  if (testsPassed) {
    console.log('\n✅ ALL TESTS PASSED! Inventory management is working correctly.');
  } else {
    console.log('\n❌ TESTS FAILED! There are issues with inventory management.');
  }
}

// Run the tests
runTests().catch(console.error);