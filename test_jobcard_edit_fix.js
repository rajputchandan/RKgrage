const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Set up axios defaults
axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testJobCardEditFix() {
  console.log('🧪 Testing Job Card Edit Fix - Only New Parts Should Be Subtracted from Inventory');
  console.log('=' .repeat(80));

  try {
    // Step 1: Get initial inventory state for test parts
    console.log('\n📦 Step 1: Getting initial inventory state...');
    const partsResponse = await axios.get(`${BASE_URL}/parts/`);
    const allParts = partsResponse.data.data;
    
    // Select two test parts
    const testPart1 = allParts[0];
    const testPart2 = allParts[1];
    
    if (!testPart1 || !testPart2) {
      console.log('❌ Need at least 2 parts in inventory to run test');
      return;
    }
    
    console.log(`📋 Test Part 1: ${testPart1.name} (ID: ${testPart1._id})`);
    console.log(`   Initial Stock: ${testPart1.stock_quantity}`);
    console.log(`📋 Test Part 2: ${testPart2.name} (ID: ${testPart2._id})`);
    console.log(`   Initial Stock: ${testPart2.stock_quantity}`);
    
    const initialStock1 = testPart1.stock_quantity;
    const initialStock2 = testPart2.stock_quantity;

    // Step 2: Get a test customer
    console.log('\n👤 Step 2: Getting test customer...');
    const customersResponse = await axios.get(`${BASE_URL}/customers/`);
    const testCustomer = customersResponse.data.data[0];
    
    if (!testCustomer) {
      console.log('❌ Need at least 1 customer to run test');
      return;
    }
    
    console.log(`👤 Test Customer: ${testCustomer.first_name} ${testCustomer.last_name}`);

    // Step 3: Create initial job card with Part 1
    console.log('\n🆕 Step 3: Creating job card with Part 1 only...');
    const initialJobCardData = {
      customer_id: testCustomer._id,
      service_type: 'General Service',
      complaint: 'Test complaint for inventory fix',
      parts_used: [{
        part_id: testPart1._id,
        quantity: 2
      }],
      labor_entries: [{
        labor_type: 'Test Labor',
        total_amount: 500
      }],
      priority: 'Medium'
    };

    const createResponse = await axios.post(`${BASE_URL}/jobcards/create`, initialJobCardData);
    const jobCard = createResponse.data.data;
    console.log(`✅ Job card created: ${jobCard.job_card_number}`);
    console.log(`📦 Initial parts: Part 1 (${testPart1.name}) x2`);

    // Step 4: Check inventory after creation
    console.log('\n📊 Step 4: Checking inventory after job card creation...');
    const afterCreateParts = await axios.get(`${BASE_URL}/parts/`);
    const part1AfterCreate = afterCreateParts.data.data.find(p => p._id === testPart1._id);
    const part2AfterCreate = afterCreateParts.data.data.find(p => p._id === testPart2._id);
    
    console.log(`📦 Part 1 stock after creation: ${part1AfterCreate.stock_quantity} (was ${initialStock1}, should be ${initialStock1 - 2})`);
    console.log(`📦 Part 2 stock after creation: ${part2AfterCreate.stock_quantity} (was ${initialStock2}, should be unchanged)`);
    
    if (part1AfterCreate.stock_quantity !== initialStock1 - 2) {
      console.log('❌ Part 1 stock not correctly reduced during creation');
      return;
    }
    
    if (part2AfterCreate.stock_quantity !== initialStock2) {
      console.log('❌ Part 2 stock incorrectly changed during creation');
      return;
    }

    // Step 5: Edit job card - Add Part 2 and increase Part 1 quantity
    console.log('\n✏️ Step 5: Editing job card - Adding Part 2 and increasing Part 1 quantity...');
    const editedPartsData = {
      parts_used: [
        {
          part_id: testPart1._id,
          part_name: testPart1.name,
          part_number: testPart1.part_number,
          quantity: 3, // Increased from 2 to 3
          unit_price: testPart1.selling_price,
          total_price: testPart1.selling_price * 3
        },
        {
          part_id: testPart2._id,
          part_name: testPart2.name,
          part_number: testPart2.part_number,
          quantity: 1, // New part
          unit_price: testPart2.selling_price,
          total_price: testPart2.selling_price * 1
        }
      ],
      update_mode: 'edit'
    };

    const editResponse = await axios.put(`${BASE_URL}/jobcards/update-parts/${jobCard._id}`, editedPartsData);
    console.log(`✅ Job card parts updated successfully`);
    console.log(`📦 Updated parts: Part 1 (${testPart1.name}) x3, Part 2 (${testPart2.name}) x1`);

    // Step 6: Check inventory after edit
    console.log('\n📊 Step 6: Checking inventory after job card edit...');
    const afterEditParts = await axios.get(`${BASE_URL}/parts/`);
    const part1AfterEdit = afterEditParts.data.data.find(p => p._id === testPart1._id);
    const part2AfterEdit = afterEditParts.data.data.find(p => p._id === testPart2._id);
    
    console.log(`📦 Part 1 stock after edit: ${part1AfterEdit.stock_quantity}`);
    console.log(`   Expected: ${initialStock1 - 3} (initial ${initialStock1} - final quantity 3)`);
    console.log(`   Change from creation: ${part1AfterEdit.stock_quantity - part1AfterCreate.stock_quantity} (should be -1)`);
    
    console.log(`📦 Part 2 stock after edit: ${part2AfterEdit.stock_quantity}`);
    console.log(`   Expected: ${initialStock2 - 1} (initial ${initialStock2} - new quantity 1)`);
    console.log(`   Change from creation: ${part2AfterEdit.stock_quantity - part2AfterCreate.stock_quantity} (should be -1)`);

    // Step 7: Verify the fix worked correctly
    console.log('\n🔍 Step 7: Verifying the fix...');
    let testPassed = true;
    
    // Part 1: Should have reduced by 1 more (from 2 to 3 total)
    const expectedPart1Stock = initialStock1 - 3;
    if (part1AfterEdit.stock_quantity !== expectedPart1Stock) {
      console.log(`❌ Part 1 stock incorrect. Expected: ${expectedPart1Stock}, Got: ${part1AfterEdit.stock_quantity}`);
      testPassed = false;
    } else {
      console.log(`✅ Part 1 stock correct: ${part1AfterEdit.stock_quantity}`);
    }
    
    // Part 2: Should have reduced by 1 (new part)
    const expectedPart2Stock = initialStock2 - 1;
    if (part2AfterEdit.stock_quantity !== expectedPart2Stock) {
      console.log(`❌ Part 2 stock incorrect. Expected: ${expectedPart2Stock}, Got: ${part2AfterEdit.stock_quantity}`);
      testPassed = false;
    } else {
      console.log(`✅ Part 2 stock correct: ${part2AfterEdit.stock_quantity}`);
    }

    // Step 8: Clean up - Delete the test job card
    console.log('\n🧹 Step 8: Cleaning up test data...');
    await axios.delete(`${BASE_URL}/jobcards/delete/${jobCard._id}`);
    console.log('✅ Test job card deleted (inventory should be restored)');

    // Step 9: Final verification
    console.log('\n📊 Step 9: Final inventory check after cleanup...');
    const finalParts = await axios.get(`${BASE_URL}/parts/`);
    const part1Final = finalParts.data.data.find(p => p._id === testPart1._id);
    const part2Final = finalParts.data.data.find(p => p._id === testPart2._id);
    
    console.log(`📦 Part 1 final stock: ${part1Final.stock_quantity} (should be back to ${initialStock1})`);
    console.log(`📦 Part 2 final stock: ${part2Final.stock_quantity} (should be back to ${initialStock2})`);
    
    if (part1Final.stock_quantity !== initialStock1 || part2Final.stock_quantity !== initialStock2) {
      console.log('❌ Inventory not properly restored after deletion');
      testPassed = false;
    } else {
      console.log('✅ Inventory properly restored after deletion');
    }

    // Final result
    console.log('\n' + '=' .repeat(80));
    if (testPassed) {
      console.log('🎉 TEST PASSED: Job card edit fix is working correctly!');
      console.log('✅ Only new/increased parts are subtracted from inventory');
      console.log('✅ Existing parts remain unchanged in inventory');
      console.log('✅ Inventory is properly restored on deletion');
    } else {
      console.log('❌ TEST FAILED: Job card edit fix needs more work');
    }
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  console.log('⚠️  Please update the TEST_TOKEN variable with a valid JWT token before running this test');
  console.log('⚠️  Make sure the server is running on http://localhost:5000');
  console.log('⚠️  Uncomment the line below to run the test:');
  console.log('');
  // testJobCardEditFix();
}

module.exports = { testJobCardEditFix };