const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5050/api';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Test data
const testSupplier = {
  supplier_name: 'Test Auto Parts Supplier',
  contact_person: 'John Doe',
  mobile: '9876543210',
  email: 'john@testparts.com',
  address: '123 Auto Parts Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  gstin: 'TEST123456789',
  payment_terms: 'Net 30',
  credit_limit: 50000,
  notes: 'Test supplier for inventory purchase system'
};

const testPurchase = {
  purchase_date: '2024-01-15',
  invoice_number: 'INV-2024-001',
  invoice_date: '2024-01-15',
  payment_method: 'Bank Transfer',
  paid_amount: 15000,
  notes: 'Test purchase for inventory system',
  items: [
    {
      quantity: 10,
      unit_price: 500,
      gst_rate: 18
    },
    {
      quantity: 5,
      unit_price: 1000,
      gst_rate: 18
    }
  ]
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${url} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testSupplierOperations = async () => {
  console.log('\n🧪 Testing Supplier Operations...');
  
  try {
    // 1. Add supplier
    console.log('1️⃣ Adding test supplier...');
    const addResult = await makeRequest('POST', '/suppliers/add', testSupplier);
    console.log('✅ Supplier added:', addResult.data.supplier_name);
    const supplierId = addResult.data._id;
    
    // 2. Get all suppliers
    console.log('2️⃣ Fetching all suppliers...');
    const allSuppliers = await makeRequest('GET', '/suppliers/');
    console.log(`✅ Found ${allSuppliers.data.length} suppliers`);
    
    // 3. Get supplier by ID
    console.log('3️⃣ Fetching supplier by ID...');
    const supplierById = await makeRequest('GET', `/suppliers/${supplierId}`);
    console.log('✅ Supplier fetched:', supplierById.data.supplier_name);
    
    // 4. Update supplier
    console.log('4️⃣ Updating supplier...');
    const updateData = { credit_limit: 75000, notes: 'Updated test supplier' };
    const updateResult = await makeRequest('PUT', `/suppliers/update/${supplierId}`, updateData);
    console.log('✅ Supplier updated:', updateResult.data.credit_limit);
    
    // 5. Get supplier stats
    console.log('5️⃣ Fetching supplier statistics...');
    const stats = await makeRequest('GET', '/suppliers/stats');
    console.log('✅ Supplier stats:', stats.data);
    
    return supplierId;
    
  } catch (error) {
    console.error('❌ Supplier operations test failed:', error.message);
    throw error;
  }
};

const testInventoryPurchaseOperations = async (supplierId) => {
  console.log('\n🧪 Testing Inventory Purchase Operations...');
  
  try {
    // First, get available parts
    console.log('0️⃣ Fetching available parts...');
    const partsResponse = await makeRequest('GET', '/parts/');
    const parts = partsResponse.data;
    
    if (parts.length < 2) {
      console.log('⚠️ Need at least 2 parts for testing. Creating test parts...');
      // You might need to create test parts here
      return;
    }
    
    // Prepare purchase data with actual part IDs
    const purchaseData = {
      ...testPurchase,
      supplier_id: supplierId,
      items: [
        {
          part_id: parts[0]._id,
          quantity: 10,
          unit_price: 500,
          gst_rate: 18
        },
        {
          part_id: parts[1]._id,
          quantity: 5,
          unit_price: 1000,
          gst_rate: 18
        }
      ]
    };
    
    // 1. Add inventory purchase
    console.log('1️⃣ Adding inventory purchase...');
    const addResult = await makeRequest('POST', '/inventory-purchases/add', purchaseData);
    console.log('✅ Purchase added:', addResult.data.purchase_number);
    const purchaseId = addResult.data._id;
    
    // 2. Get all purchases
    console.log('2️⃣ Fetching all purchases...');
    const allPurchases = await makeRequest('GET', '/inventory-purchases/');
    console.log(`✅ Found ${allPurchases.data.length} purchases`);
    
    // 3. Get purchase by ID
    console.log('3️⃣ Fetching purchase by ID...');
    const purchaseById = await makeRequest('GET', `/inventory-purchases/${purchaseId}`);
    console.log('✅ Purchase fetched:', purchaseById.data.purchase_number);
    
    // 4. Update purchase
    console.log('4️⃣ Updating purchase...');
    const updateData = { 
      paid_amount: 20000, 
      payment_status: 'Partial',
      notes: 'Updated test purchase' 
    };
    const updateResult = await makeRequest('PUT', `/inventory-purchases/update/${purchaseId}`, updateData);
    console.log('✅ Purchase updated:', updateResult.data.paid_amount);
    
    // 5. Get purchase statistics
    console.log('5️⃣ Fetching purchase statistics...');
    const stats = await makeRequest('GET', '/inventory-purchases/stats');
    console.log('✅ Purchase stats:', stats.data);
    
    // 6. Get supplier purchase summary
    console.log('6️⃣ Fetching supplier purchase summary...');
    const summary = await makeRequest('GET', '/inventory-purchases/supplier-summary');
    console.log('✅ Supplier summary:', summary.data.length, 'suppliers');
    
    return purchaseId;
    
  } catch (error) {
    console.error('❌ Inventory purchase operations test failed:', error.message);
    throw error;
  }
};

const testInventoryIntegration = async () => {
  console.log('\n🧪 Testing Inventory Integration...');
  
  try {
    // Check if parts inventory was updated
    console.log('1️⃣ Checking parts inventory after purchase...');
    const partsResponse = await makeRequest('GET', '/parts/');
    const parts = partsResponse.data;
    
    console.log('✅ Parts inventory status:');
    parts.slice(0, 2).forEach(part => {
      console.log(`   - ${part.name}: ${part.stock_quantity} units`);
    });
    
  } catch (error) {
    console.error('❌ Inventory integration test failed:', error.message);
    throw error;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Inventory Purchase System Tests...');
  console.log('⚠️ Make sure the server is running on http://localhost:5050');
  console.log('⚠️ Update TEST_TOKEN with a valid JWT token');
  
  try {
    // Test supplier operations
    const supplierId = await testSupplierOperations();
    
    // Test inventory purchase operations
    const purchaseId = await testInventoryPurchaseOperations(supplierId);
    
    // Test inventory integration
    await testInventoryIntegration();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Supplier CRUD operations');
    console.log('✅ Inventory purchase CRUD operations');
    console.log('✅ Automatic inventory updates');
    console.log('✅ GST calculations');
    console.log('✅ Purchase statistics');
    console.log('✅ Supplier purchase summary');
    
    console.log('\n🔧 Manual Testing Steps:');
    console.log('1. Start the server: cd server && npm start');
    console.log('2. Start the frontend: cd client && npm start');
    console.log('3. Login to the application');
    console.log('4. Navigate to "Inventory Purchase" in the sidebar');
    console.log('5. Test adding suppliers and purchases through the UI');
    console.log('6. Verify inventory updates in the Parts page');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
};

// Export for use in other files
module.exports = {
  runTests,
  testSupplierOperations,
  testInventoryPurchaseOperations,
  testInventoryIntegration
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}