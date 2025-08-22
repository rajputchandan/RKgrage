// Test script to reproduce and fix the double entry issue
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
    
    // Create test part with limited stock to trigger the issue
    const partResponse = await axios.post(`${BASE_URL}/parts/add`, {
      name: 'Engine Oil',
      part_number: 'EO001-TEST',
      category: 'Engine',
      stock_quantity: 5, // Very limited stock to trigger insufficient stock error
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

async function testDoubleEntryIssue() {
  try {
    console.log('\n🧪 Testing double entry issue...');
    
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
    
    // Step 2: Try to update with duplicate entries (this should cause the issue)
    console.log('\n🔄 Step 2: Updating with potential duplicate entries...');
    console.log('Simulating frontend sending duplicate part entries...');
    
    try {
      await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
        parts_used: [
          {
            part_id: testPartId,
            quantity: 3
          },
          {
            part_id: testPartId,
            quantity: 3  // Duplicate entry - this causes the issue
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('❌ ISSUE REPRODUCED: Update succeeded when it should have failed due to double counting');
      
    } catch (error) {
      if (error.response?.data?.message?.includes('Insufficient stock')) {
        console.log('✅ ISSUE REPRODUCED:', error.response.data.message);
        console.log('The system is incorrectly adding 3+3=6 parts instead of treating them as a single 3-part entry');
        return true;
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
        return false;
      }
    }
    
    return false;
    
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

async function runDoubleEntryTest() {
  console.log('🚀 Starting double entry issue test...\n');
  
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
  
  const issueReproduced = await testDoubleEntryIssue();
  
  await cleanup();
  
  if (issueReproduced) {
    console.log('\n🔍 ISSUE CONFIRMED: Double entry problem exists');
    console.log('📋 Problem: When frontend sends duplicate part entries, the system adds quantities together');
    console.log('💡 Solution needed: Deduplicate parts before processing or handle multiple entries correctly');
  } else {
    console.log('\n❓ Could not reproduce the double entry issue');
  }
}

// Run the test
runDoubleEntryTest().catch(console.error);