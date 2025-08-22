const axios = require('axios');

async function testManualReport() {
    console.log('🧪 Testing Manual Report Functionality...\n');
    
    try {
        // Wait for server to be ready
        console.log('⏳ Waiting for server to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test the manual report endpoint
        console.log('📧 Testing manual report endpoint...');
        const response = await axios.post('http://localhost:5000/api/reports/send-daily-report', {}, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });
        
        console.log('✅ Response Status:', response.status);
        console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 Manual report sent successfully!');
        } else {
            console.log('\n❌ Manual report failed:', response.data.message);
        }
        
    } catch (error) {
        console.log('\n❌ Error testing manual report:');
        
        if (error.response) {
            // Server responded with error status
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.log('No response received from server');
            console.log('Request details:', error.request);
        } else {
            // Something else happened
            console.log('Error message:', error.message);
        }
        
        console.log('\n🔍 Possible issues:');
        console.log('1. Server not running on port 5000');
        console.log('2. Reports route not properly configured');
        console.log('3. Email service configuration issue');
        console.log('4. Database connection problem');
    }
}

// Run the test
testManualReport();