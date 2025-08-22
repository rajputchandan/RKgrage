const http = require('http');

async function testManualReportWithAuth() {
    console.log('🧪 Testing Manual Report Functionality with Authentication...\n');
    
    try {
        // First, let's test login to get a token
        console.log('🔐 Testing login to get authentication token...');
        
        const loginData = JSON.stringify({
            email: "admin@example.com", // Replace with actual admin credentials
            password: "admin123"        // Replace with actual admin password
        });
        
        const loginOptions = {
            hostname: 'localhost',
            port: 5050,
            path: '/api/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };
        
        const loginResponse = await new Promise((resolve, reject) => {
            const req = http.request(loginOptions, (res) => {
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
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Login request timeout'));
            });
            
            req.write(loginData);
            req.end();
        });
        
        console.log('Login Response Status:', loginResponse.status);
        
        let token = null;
        if (loginResponse.data && loginResponse.data.token) {
            token = loginResponse.data.token;
            console.log('✅ Authentication token obtained');
        } else {
            console.log('❌ Failed to get authentication token');
            console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
            
            // Try without authentication for testing
            console.log('\n🔓 Testing without authentication (should fail with 401)...');
        }
        
        // Test the manual report endpoint
        console.log('\n📧 Testing manual report endpoint...');
        
        const reportData = JSON.stringify({});
        
        const reportOptions = {
            hostname: 'localhost',
            port: 5050,
            path: '/api/reports/send-daily-report',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reportData)
            }
        };
        
        // Add authorization header if we have a token
        if (token) {
            reportOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const reportResponse = await new Promise((resolve, reject) => {
            const req = http.request(reportOptions, (res) => {
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
                reject(new Error('Report request timeout'));
            });
            
            req.write(reportData);
            req.end();
        });
        
        console.log('✅ Report Response Status:', reportResponse.status);
        console.log('📄 Report Response Data:', JSON.stringify(reportResponse.data, null, 2));
        
        if (reportResponse.status === 200 && reportResponse.data.success) {
            console.log('\n🎉 Manual report sent successfully!');
        } else if (reportResponse.status === 401) {
            console.log('\n🔒 Authentication required - this is expected behavior');
        } else {
            console.log('\n❌ Manual report failed:', reportResponse.data.message || 'Unknown error');
        }
        
    } catch (error) {
        console.log('\n❌ Error testing manual report:');
        console.log('Error message:', error.message);
        
        console.log('\n🔍 Possible issues:');
        console.log('1. Server not running on port 5050');
        console.log('2. Authentication credentials incorrect');
        console.log('3. Email service configuration issue');
        console.log('4. Database connection problem');
    }
}

// Run the test
testManualReportWithAuth();