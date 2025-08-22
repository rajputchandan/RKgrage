// Test file to verify daily admin report functionality
const { sendReportNow } = require('./services/schedulerService');
require('dotenv').config();

const testDailyReport = async () => {
  console.log('🧪 Testing Daily Admin Report');
  console.log('==============================');
  
  console.log('📧 Admin Email:', process.env.AdminEmail);
  console.log('📅 Current Time:', new Date().toLocaleString('en-IN'));
  
  console.log('\n📊 Generating daily report...');
  
  try {
    const result = await sendReportNow();
    
    if (result.success) {
      console.log('✅ Daily admin report sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('\n📊 Report Statistics:');
      console.log('  👥 New Customers:', result.stats.newCustomers);
      console.log('  💰 Today\'s Revenue: ₹' + result.stats.todayRevenue.toFixed(2));
      console.log('  📄 Bills Today:', result.stats.billsToday);
      console.log('  ✅ Paid Bills:', result.stats.paidBillsToday);
      console.log('  ⏳ Pending Bills:', result.stats.pendingBillsToday);
      console.log('  💸 Pending Amount: ₹' + result.stats.pendingAmount.toFixed(2));
      console.log('  📦 New Parts Added:', result.stats.newParts);
      console.log('  ⚠️ Low Stock Items:', result.stats.lowStockCount);
      console.log('  🛒 Inventory Purchases:', result.stats.inventoryPurchases);
      
      console.log('\n🎉 Daily admin report functionality is working correctly!');
      console.log('📅 The report will be automatically sent every day at 11:59 PM');
      console.log('📧 Admin will receive comprehensive business summary via email');
      
    } else {
      console.log('❌ Daily admin report failed:', result.error);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check email configuration in .env file');
      console.log('2. Ensure database connection is working');
      console.log('3. Verify admin email address is correct');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testDailyReport().then(() => {
  console.log('\n✅ Daily report test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Daily report test failed:', error);
  process.exit(1);
});