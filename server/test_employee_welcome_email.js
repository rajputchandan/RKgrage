const mongoose = require('mongoose');
const Employee = require('./model/employee');
const { sendEmployeeWelcomeEmail } = require('./services/emailService');
require('dotenv').config();

// Test employee welcome email functionality
const testEmployeeWelcomeEmail = async () => {
  try {
    console.log('🧪 Testing Employee Welcome Email Functionality...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGOURL);
    console.log('✅ Connected to database');

    // Test data for new employee
    const testEmployeeData = {
      name: 'Test Employee',
      email: 'test.employee@example.com', // Change this to a real email for testing
      mobile: '9999999999',
      address: 'Test Address, Test City',
      position: 'Test Position',
      department: 'Test Department',
      joining_date: new Date(),
      monthly_salary: 25000,
      salary_type: 'Monthly',
      bank_details: {
        account_number: '1234567890',
        bank_name: 'Test Bank',
        ifsc_code: 'TEST0001',
        account_holder_name: 'Test Employee'
      },
      emergency_contact: {
        name: 'Emergency Contact',
        mobile: '8888888888',
        relation: 'Father'
      },
      documents: {
        aadhar_number: '123456789012',
        pan_number: 'ABCDE1234F'
      }
    };

    console.log('📝 Test Employee Data:');
    console.log(`   Name: ${testEmployeeData.name}`);
    console.log(`   Email: ${testEmployeeData.email}`);
    console.log(`   Position: ${testEmployeeData.position}`);
    console.log(`   Department: ${testEmployeeData.department}`);
    console.log(`   Salary: ₹${testEmployeeData.monthly_salary}\n`);

    // Create new employee
    console.log('👤 Creating new employee...');
    const employee = new Employee(testEmployeeData);
    await employee.save();
    console.log(`✅ Employee created successfully with ID: ${employee.employee_id}\n`);

    // Test sending welcome email
    console.log('📧 Sending welcome email...');
    const emailResult = await sendEmployeeWelcomeEmail(employee);
    
    if (emailResult.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`   Message ID: ${emailResult.messageId}`);
      console.log(`   Sent to: ${employee.email}`);
      console.log(`   Subject: 🎉 Welcome to RADHEKRISHNA AUTOMOBILE HARDA - ${employee.name}`);
    } else {
      console.log('❌ Failed to send welcome email');
      console.log(`   Error: ${emailResult.error}`);
    }

    console.log('\n📋 Employee Details in Email:');
    console.log(`   Employee ID: ${employee.employee_id}`);
    console.log(`   Name: ${employee.name}`);
    console.log(`   Department: ${employee.department}`);
    console.log(`   Position: ${employee.position}`);
    console.log(`   Joining Date: ${new Date(employee.joining_date).toLocaleDateString('en-IN')}`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   Mobile: ${employee.mobile}`);

    // Clean up - remove test employee
    console.log('\n🧹 Cleaning up test data...');
    await Employee.findByIdAndDelete(employee._id);
    console.log('✅ Test employee removed from database');

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Employee creation: Working');
    console.log(`   ${emailResult.success ? '✅' : '❌'} Email sending: ${emailResult.success ? 'Working' : 'Failed'}`);
    console.log('   ✅ Database cleanup: Working');

    if (emailResult.success) {
      console.log('\n💡 The welcome email functionality is working correctly!');
      console.log('   When a new employee is added through the API, they will automatically receive a welcome email.');
    } else {
      console.log('\n⚠️ Email sending failed. Please check:');
      console.log('   - Email configuration in .env file');
      console.log('   - SMTP server settings');
      console.log('   - Internet connection');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

// Test email configuration first
const testEmailConfig = async () => {
  try {
    const { testEmailConfig } = require('./services/emailService');
    console.log('🔧 Testing email configuration...');
    const configResult = await testEmailConfig();
    
    if (configResult.success) {
      console.log('✅ Email configuration is valid\n');
      return true;
    } else {
      console.log('❌ Email configuration error:', configResult.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Email configuration test failed:', error.message);
    return false;
  }
};

// Run the test
const runTest = async () => {
  console.log('🚀 Starting Employee Welcome Email Test\n');
  
  // First test email configuration
  const emailConfigValid = await testEmailConfig();
  
  if (emailConfigValid) {
    await testEmployeeWelcomeEmail();
  } else {
    console.log('\n⚠️ Skipping email test due to configuration issues');
    console.log('Please check your email settings in the .env file');
  }
};

runTest();