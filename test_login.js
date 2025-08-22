const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5050/api/admin/admin/login', {
            username: 'admin@gmail.com',
            password: 'admin123'
        });
        
        console.log('✅ Login successful!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Login failed!');
        console.log('Error:', error.response?.data || error.message);
    }
}

testLogin();