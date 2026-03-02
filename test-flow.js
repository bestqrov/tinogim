const axios = require('axios');

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

async function testFrontendFlow() {
    try {
        console.log('1. Testing login...');
        const loginRes = await api.post('/auth/login', {
            email: 'admin@injahi.com',
            password: 'admin123'
        });
        
        console.log('Login successful');
        const token = loginRes.data.data.token;
        const user = loginRes.data.data.user;
        console.log('User:', JSON.stringify(user, null, 2));
        
        // Store token like the frontend does
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('\n2. Testing /me endpoint...');
        const meRes = await api.get('/auth/me');
        console.log('Me response:', JSON.stringify(meRes.data, null, 2));
        
        console.log('\n3. Testing role check...');
        const allowedRoles = ['ADMIN'];
        const userRole = user.role;
        
        if (allowedRoles.includes(userRole) || userRole === 'SUPER_ADMIN') {
            console.log('✅ User should be allowed access');
        } else {
            console.log('❌ User should be redirected');
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testFrontendFlow();