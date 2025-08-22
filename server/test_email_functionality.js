// Test file to verify email functionality
const { sendBillReadyNotification, testEmailConfig } = require('./services/emailService');
require('dotenv').config();

// Test email configuration
const testEmail = async () => {
  console.log('🧪 Testing Email Functionality');
  console.log('==============================');
  
  // Test email configuration
  console.log('📧 Testing email configuration...');
  const configTest = await testEmailConfig();
  if (configTest.success) {
    console.log('✅ Email configuration is valid');
  } else {
    console.log('❌ Email configuration error:', configTest.error);
    console.log('\n📝 To fix this, update your .env file with:');
    console.log('EMAIL_USER=your-gmail@gmail.com');
    console.log('EMAIL_PASS=your-app-password');
    console.log('\n💡 Note: Use Gmail App Password, not regular password');
    console.log('   1. Go to Google Account settings');
    console.log('   2. Enable 2-Factor Authentication');
    console.log('   3. Generate App Password for "Mail"');
    console.log('   4. Use that password in EMAIL_PASS');
    return;
  }
  
  // Test email sending with sample data
  console.log('\n📧 Testing email sending with sample data...');
  
  const sampleCustomer = {
    first_name: 'Priyanshu',
    last_name: 'Sharma',
    email: 'test@example.com', // Change this to your test email
    phone: '83293323',
    vehicle_number: 'MP 09 AB 1234'
  };
  
  const sampleBill = {
    invoice_number: 'INV' + Date.now(),
    date: new Date(),
    parts_total: 2500.00,
    labor_total: 1500.00,
    gst_enabled: true,
    gst_amount: 720.00,
    discount: 0,
    total_amount: 4720.00,
    payment_status: 'paid'
  };
  
  console.log('📋 Sample data:');
  console.log('Customer:', sampleCustomer.first_name, sampleCustomer.last_name);
  console.log('Vehicle:', sampleCustomer.vehicle_number);
  console.log('Email:', sampleCustomer.email);
  console.log('Total Amount: ₹' + sampleBill.total_amount);
  
  const emailResult = await sendBillReadyNotification(sampleCustomer, sampleBill);
  
  if (emailResult.success) {
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', emailResult.messageId);
    console.log('\n🎉 Email functionality is working correctly!');
    console.log('💡 When a real bill is created, customers will automatically receive this email.');
  } else {
    console.log('❌ Test email failed:', emailResult.error);
  }
};

// Run the test
testEmail().then(() => {
  console.log('\n✅ Email test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Email test failed:', error);
  process.exit(1);
});