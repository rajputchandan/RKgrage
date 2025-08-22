const http = require('http');

async function testManualReport() {
    console.log('🧪 Testing Manual Report Functionality...\n');
    
    try {
        // Wait for server to be ready
        console.log('⏳ Waiting for server to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test the manual report endpoint
        console.log('📧 Testing manual report endpoint...');
        
        const postData = JSON.stringify({});
        
        const options = {
            hostname: 'localhost',
            port: 5050,
            path: '/api/reports/send-daily-report',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            status: res.statusCode,
                            data: jsonData
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: data
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.write(postData);
            req.end();
        });
        
        console.log('✅ Response Status:', response.status);
        console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 Manual report sent successfully!');
        } else {
            console.log('\n❌ Manual report failed:', response.data.message || 'Unknown error');
        }
        
    } catch (error) {
        console.log('\n❌ Error testing manual report:');
        console.log('Error message:', error.message);
        
        console.log('\n🔍 Possible issues:');
        console.log('1. Server not running on port 5050');
        console.log('2. Reports route not properly configured');
        console.log('3. Email service configuration issue');
        console.log('4. Database connection problem');
        console.log('5. CORS or authentication issue');
    }
}

// Run the test
testManualReport();