// Test script to verify the additive behavior (new parts added to existing ones)
const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

// Test data
let testCustomerId = null;
let testPartId1 = null;
let testPartId2 = null;
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
    
    // Create test part 1 - Engine Oil
    const part1Response = await axios.post(`${BASE_URL}/parts/add`, {
      name: 'Engine Oil',
      part_number: 'EO001-ADDITIVE',
      category: 'Engine',
      stock_quantity: 50,
      selling_price: 500,
      gst_rate: 18,
      supplier: 'Test Supplier',
      min_stock_level: 5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testPartId1 = part1Response.data.data._id;
    console.log('✅ Test part 1 created:', testPartId1, 'with stock:', part1Response.data.data.stock_quantity);
    
    // Create test part 2 - Brake Fluid
    const part2Response = await axios.post(`${BASE_URL}/parts/add`, {
      name: 'Brake Fluid',
      part_number: 'BF001-ADDITIVE',
      category: 'Brake',
      stock_quantity: 30,
      selling_price: 300,
      gst_rate: 18,
      supplier: 'Test Supplier',
      min_stock_level: 3
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testPartId2 = part2Response.data.data._id;
    console.log('✅ Test part 2 created:', testPartId2, 'with stock:', part2Response.data.data.stock_quantity);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to create test data:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getPartStock(partId) {
  try {
    const response = await axios.get(`${BASE_URL}/parts/${partId}`, {
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

async function testAdditiveBehavior() {
  try {
    console.log('\n🧪 Testing additive behavior (new parts added to existing)...');
    
    // Step 1: Create job card with initial parts
    console.log('\n🔨 Step 1: Creating job card with initial parts...');
    console.log('   - 3 Engine Oil');
    console.log('   - 2 Brake Fluid');
    
    const initialOilStock = await getPartStock(testPartId1);
    const initialBrakeStock = await getPartStock(testPartId2);
    console.log(`📦 Initial stocks: Oil=${initialOilStock}, Brake=${initialBrakeStock}`);
    
    const jobCardResponse = await axios.post(`${BASE_URL}/jobcards/create`, {
      customer_id: testCustomerId,
      service_type: 'Engine Repair',
      complaint: 'Engine and brake service needed',
      parts_used: [
        {
          part_id: testPartId1,
          quantity: 3
        },
        {
          part_id: testPartId2,
          quantity: 2
        }
      ],
      labor_entries: [{
        labor_type: 'Service',
        total_amount: 500
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testJobCardId = jobCardResponse.data.data._id;
    console.log('✅ Job card created:', testJobCardId);
    
    const stockAfterCreation1 = await getPartStock(testPartId1);
    const stockAfterCreation2 = await getPartStock(testPartId2);
    console.log(`📦 Stocks after creation: Oil=${stockAfterCreation1}, Brake=${stockAfterCreation2}`);
    
    let jobCardParts = await getJobCardParts();
    console.log('📋 Initial job card parts:');
    jobCardParts.forEach(part => {
      console.log(`   - ${part.part_name}: ${part.quantity} units`);
    });
    
    // Step 2: Add more parts (should ADD to existing, not replace)
    console.log('\n🔄 Step 2: Adding more parts to existing job card...');
    console.log('   - Adding 2 more Engine Oil (should become 3+2=5 total)');
    console.log('   - Adding 1 more Brake Fluid (should become 2+1=3 total)');
    
    try {
      const updateResponse = await axios.put(`${BASE_URL}/jobcards/update-parts/${testJobCardId}`, {
        parts_used: [
          {
            part_id: testPartId1,
            quantity: 2  // Adding 2 more to existing 3
          },
          {
            part_id: testPartId2,
            quantity: 1  // Adding 1 more to existing 2
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Parts update succeeded');
      
      jobCardParts = await getJobCardParts();
      console.log('📋 Final job card parts:');
      
      let oilPart = jobCardParts.find(p => (p.part_id._id || p.part_id).toString() === testPartId1);
      let brakePart = jobCardParts.find(p => (p.part_id._id || p.part_id).toString() === testPartId2);
      
      console.log(`   - Engine Oil: ${oilPart ? oilPart.quantity : 0} units (expected: 5)`);
      console.log(`   - Brake Fluid: ${brakePart ? brakePart.quantity : 0} units (expected: 3)`);
      
      const finalOilStock = await getPartStock(testPartId1);
      const finalBrakeStock = await getPartStock(testPartId2);
      console.log(`📦 Final stocks: Oil=${finalOilStock}, Brake=${finalBrakeStock}`);
      
      // Expected: Oil stock should be initialOilStock - 5, Brake stock should be initialBrakeStock - 3
      const expectedOilStock = initialOilStock - 5;
      const expectedBrakeStock = initialBrakeStock - 3;
      
      if (oilPart && oilPart.quantity === 5 && 
          brakePart && brakePart.quantity === 3 &&
          finalOilStock === expectedOilStock &&
          finalBrakeStock === expectedBrakeStock) {
        console.log('✅ ADDITIVE BEHAVIOR WORKING CORRECTLY!');
        console.log('   ✅ Engine Oil: 3 + 2 = 5 parts');
        console.log('   ✅ Brake Fluid: 2 + 1 = 3 parts');
        console.log('   ✅ Inventory properly managed');
        return true;
      } else {
        console.log('❌ ADDITIVE BEHAVIOR NOT WORKING:');
        console.log(`   Expected: Oil=5, Brake=3, OilStock=${expectedOilStock}, BrakeStock=${expectedBrakeStock}`);
        console.log(`   Got: Oil=${oilPart?.quantity}, Brake=${brakePart?.quantity}, OilStock=${finalOilStock}, BrakeStock=${finalBrakeStock}`);
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
    
    if (testPartId1) {
      await axios.delete(`${BASE_URL}/parts/delete/${testPartId1}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test part 1 deleted');
    }
    
    if (testPartId2) {
      await axios.delete(`${BASE_URL}/parts/delete/${testPartId2}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test part 2 deleted');
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

async function runAdditiveBehaviorTest() {
  console.log('🚀 Starting additive behavior test...\n');
  console.log('This test verifies that new parts are ADDED to existing parts, not replaced');
  
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
  
  const additiveWorking = await testAdditiveBehavior();
  
  await cleanup();
  
  if (additiveWorking) {
    console.log('\n🎉 ADDITIVE BEHAVIOR WORKING PERFECTLY!');
    console.log('📋 Verified:');
    console.log('   ✅ New parts are added to existing parts (not replaced)');
    console.log('   ✅ Quantities are correctly accumulated');
    console.log('   ✅ Inventory is properly managed for additive behavior');
    console.log('   ✅ Multiple parts can be added simultaneously');
  } else {
    console.log('\n❌ Additive behavior not working as expected');
  }
}

// Run the test
runAdditiveBehaviorTest().catch(console.error);