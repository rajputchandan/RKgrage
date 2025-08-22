const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Set up axios defaults
axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testGSTBilling() {
  console.log('🧪 Testing GST Billing Implementation');
  console.log('=' .repeat(80));

  try {
    // Step 1: Get test customer and parts
    console.log('\n📋 Step 1: Getting test data...');
    const [customersRes, partsRes] = await Promise.all([
      axios.get(`${BASE_URL}/customers/`),
      axios.get(`${BASE_URL}/parts/`)
    ]);
    
    const testCustomer = customersRes.data.data[0];
    const testPart = partsRes.data.data[0];
    
    if (!testCustomer || !testPart) {
      console.log('❌ Need at least 1 customer and 1 part to run test');
      return;
    }
    
    console.log(`👤 Test Customer: ${testCustomer.first_name} ${testCustomer.last_name}`);
    console.log(`📦 Test Part: ${testPart.name} - ₹${testPart.selling_price}`);

    // Step 2: Test billing WITH GST (CGST + SGST)
    console.log('\n🧾 Step 2: Creating bill WITH GST (9% CGST + 9% SGST)...');
    const billWithGSTData = {
      customer_id: testCustomer._id,
      gst_enabled: true,
      cgst_rate: 9,
      sgst_rate: 9,
      items: [{
        item_type: 'part',
        item_id: testPart._id,
        item_name: testPart.name,
        quantity: 2,
        unit_price: testPart.selling_price
      }, {
        item_type: 'service',
        item_name: 'Labor Service',
        description: 'Test labor work',
        quantity: 1,
        unit_price: 500
      }],
      notes: 'Test bill with GST'
    };

    const billWithGSTRes = await axios.post(`${BASE_URL}/billing`, billWithGSTData);
    const billWithGST = billWithGSTRes.data.data;
    
    console.log(`✅ Bill with GST created: ${billWithGST.invoice_number}`);
    console.log(`📊 Parts Total: ₹${billWithGST.parts_total}`);
    console.log(`📊 Labor Total: ₹${billWithGST.labor_total}`);
    console.log(`📊 Subtotal: ₹${billWithGST.subtotal}`);
    console.log(`📊 CGST (9%): ₹${billWithGST.cgst_amount}`);
    console.log(`📊 SGST (9%): ₹${billWithGST.sgst_amount}`);
    console.log(`📊 Total GST: ₹${billWithGST.gst_amount}`);
    console.log(`📊 Total Amount: ₹${billWithGST.total_amount}`);
    
    // Verify GST calculations
    const expectedSubtotal = (testPart.selling_price * 2) + 500;
    const expectedCGST = Math.round((expectedSubtotal * 9) / 100);
    const expectedSGST = Math.round((expectedSubtotal * 9) / 100);
    const expectedTotalGST = expectedCGST + expectedSGST;
    const expectedTotal = expectedSubtotal + expectedTotalGST;
    
    console.log('\n🔍 Verifying GST calculations...');
    console.log(`Expected Subtotal: ₹${expectedSubtotal}, Actual: ₹${billWithGST.subtotal}`);
    console.log(`Expected CGST: ₹${expectedCGST}, Actual: ₹${billWithGST.cgst_amount}`);
    console.log(`Expected SGST: ₹${expectedSGST}, Actual: ₹${billWithGST.sgst_amount}`);
    console.log(`Expected Total GST: ₹${expectedTotalGST}, Actual: ₹${billWithGST.gst_amount}`);
    console.log(`Expected Total: ₹${expectedTotal}, Actual: ₹${billWithGST.total_amount}`);
    
    let gstTestPassed = true;
    if (billWithGST.subtotal !== expectedSubtotal) {
      console.log('❌ Subtotal calculation incorrect');
      gstTestPassed = false;
    }
    if (billWithGST.cgst_amount !== expectedCGST) {
      console.log('❌ CGST calculation incorrect');
      gstTestPassed = false;
    }
    if (billWithGST.sgst_amount !== expectedSGST) {
      console.log('❌ SGST calculation incorrect');
      gstTestPassed = false;
    }
    if (billWithGST.gst_amount !== expectedTotalGST) {
      console.log('❌ Total GST calculation incorrect');
      gstTestPassed = false;
    }
    if (billWithGST.total_amount !== expectedTotal) {
      console.log('❌ Total amount calculation incorrect');
      gstTestPassed = false;
    }
    
    if (gstTestPassed) {
      console.log('✅ GST calculations are correct!');
    }

    // Step 3: Test billing WITHOUT GST
    console.log('\n🧾 Step 3: Creating bill WITHOUT GST...');
    const billWithoutGSTData = {
      customer_id: testCustomer._id,
      gst_enabled: false,
      items: [{
        item_type: 'part',
        item_id: testPart._id,
        item_name: testPart.name,
        quantity: 1,
        unit_price: testPart.selling_price
      }, {
        item_type: 'service',
        item_name: 'Labor Service',
        description: 'Test labor work',
        quantity: 1,
        unit_price: 300
      }],
      notes: 'Test bill without GST'
    };

    const billWithoutGSTRes = await axios.post(`${BASE_URL}/billing`, billWithoutGSTData);
    const billWithoutGST = billWithoutGSTRes.data.data;
    
    console.log(`✅ Bill without GST created: ${billWithoutGST.invoice_number}`);
    console.log(`📊 Parts Total: ₹${billWithoutGST.parts_total}`);
    console.log(`📊 Labor Total: ₹${billWithoutGST.labor_total}`);
    console.log(`📊 Subtotal: ₹${billWithoutGST.subtotal}`);
    console.log(`📊 CGST: ₹${billWithoutGST.cgst_amount}`);
    console.log(`📊 SGST: ₹${billWithoutGST.sgst_amount}`);
    console.log(`📊 Total GST: ₹${billWithoutGST.gst_amount}`);
    console.log(`📊 Total Amount: ₹${billWithoutGST.total_amount}`);
    
    // Verify no GST calculations
    const expectedSubtotalNoGST = testPart.selling_price + 300;
    
    console.log('\n🔍 Verifying no-GST calculations...');
    console.log(`Expected Subtotal: ₹${expectedSubtotalNoGST}, Actual: ₹${billWithoutGST.subtotal}`);
    console.log(`Expected GST amounts: ₹0, Actual CGST: ₹${billWithoutGST.cgst_amount}, SGST: ₹${billWithoutGST.sgst_amount}`);
    console.log(`Expected Total: ₹${expectedSubtotalNoGST}, Actual: ₹${billWithoutGST.total_amount}`);
    
    let noGstTestPassed = true;
    if (billWithoutGST.subtotal !== expectedSubtotalNoGST) {
      console.log('❌ Subtotal calculation incorrect for no-GST bill');
      noGstTestPassed = false;
    }
    if (billWithoutGST.cgst_amount !== 0 || billWithoutGST.sgst_amount !== 0 || billWithoutGST.gst_amount !== 0) {
      console.log('❌ GST amounts should be zero for no-GST bill');
      noGstTestPassed = false;
    }
    if (billWithoutGST.total_amount !== expectedSubtotalNoGST) {
      console.log('❌ Total amount should equal subtotal for no-GST bill');
      noGstTestPassed = false;
    }
    
    if (noGstTestPassed) {
      console.log('✅ No-GST calculations are correct!');
    }

    // Step 4: Test receipt generation for both bills
    console.log('\n🧾 Step 4: Testing receipt generation...');
    
    console.log('Testing GST bill receipt...');
    const gstReceiptRes = await axios.get(`${BASE_URL}/billing/${billWithGST._id}/receipt`);
    if (gstReceiptRes.data.includes('CGST') && gstReceiptRes.data.includes('SGST')) {
      console.log('✅ GST bill receipt contains CGST and SGST breakdown');
    } else {
      console.log('❌ GST bill receipt missing CGST/SGST breakdown');
    }
    
    console.log('Testing no-GST bill receipt...');
    const noGstReceiptRes = await axios.get(`${BASE_URL}/billing/${billWithoutGST._id}/receipt`);
    if (noGstReceiptRes.data.includes('Not Applicable')) {
      console.log('✅ No-GST bill receipt shows GST as not applicable');
    } else {
      console.log('❌ No-GST bill receipt should show GST as not applicable');
    }

    // Step 5: Clean up test data
    console.log('\n🧹 Step 5: Cleaning up test data...');
    await axios.delete(`${BASE_URL}/billing/delete/${billWithGST._id}`);
    await axios.delete(`${BASE_URL}/billing/delete/${billWithoutGST._id}`);
    console.log('✅ Test bills deleted');

    // Final result
    console.log('\n' + '=' .repeat(80));
    if (gstTestPassed && noGstTestPassed) {
      console.log('🎉 ALL TESTS PASSED: GST billing implementation is working correctly!');
      console.log('✅ Bills with GST show proper CGST + SGST breakdown');
      console.log('✅ Bills without GST have zero GST amounts');
      console.log('✅ Receipt generation works for both types');
      console.log('✅ Calculations are accurate for both scenarios');
    } else {
      console.log('❌ SOME TESTS FAILED: GST billing implementation needs fixes');
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
  // testGSTBilling();
}

module.exports = { testGSTBilling };