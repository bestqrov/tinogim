const axios = require('axios');

async function testMe() {
    try {
        // First login
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@injahi.com',
            password: 'admin123'
        });
        
        console.log('Login successful');
        const token = loginRes.data.data.token;
        
        // Then test /me endpoint
        const meRes = await axios.get('http://localhost:3000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Me endpoint response:', JSON.stringify(meRes.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testMe();