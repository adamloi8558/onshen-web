// Test Payment API Connection
const https = require('https');

const PAYMENT_API_BASE = 'https://barite.shengzhipay.com';
const PAYMENT_USERNAME = 'ronglakorn';
const PAYMENT_API_KEY = '3f17b5c0-7402-41cb-a2a2-dac94320dc22';

// Create Basic Auth header
function createAuthHeader() {
  const credentials = `${PAYMENT_USERNAME}:${PAYMENT_API_KEY}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

// Test API connection
async function testPaymentAPI() {
  console.log('=== Testing Payment API Connection ===');
  
  try {
    // Test 1: Get user info
    console.log('1. Testing /user/me endpoint...');
    
    const response = await fetch(`${PAYMENT_API_BASE}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ API connection successful!');
      console.log('User info:', data);
      
      // Test 1.5: Try to get API documentation or available endpoints
      console.log('\n1.5. Testing common documentation endpoints...');
      const docEndpoints = ['/docs', '/api', '/help', '/endpoints', '/methods', '/'];
      
      for (const docPath of docEndpoints) {
        try {
          const docResponse = await fetch(`${PAYMENT_API_BASE}${docPath}`, {
            method: 'GET',
            headers: {
              'Authorization': createAuthHeader(),
              'Content-Type': 'application/json',
            },
          });
          
          if (docResponse.status === 200) {
            const docText = await docResponse.text();
            console.log(`✅ Found documentation at ${docPath}:`);
            console.log(docText.substring(0, 500) + '...');
            break;
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }
      
      // Test 2: Try different endpoints
      const endpoints = [
        { path: '/transaction/create', method: 'POST', body: { type: 'qrcode_slip', amount: 100 } },
        { path: '/create', method: 'POST', body: { type: 'qrcode_slip', amount: 100 } },
        { path: '/payment/create', method: 'POST', body: { type: 'qrcode_slip', amount: 100 } },
        { path: '/api/transaction/create', method: 'POST', body: { type: 'qrcode_slip', amount: 100 } },
        { path: '/v1/transaction/create', method: 'POST', body: { type: 'qrcode_slip', amount: 100 } },
        { path: '/transaction', method: 'POST', body: { type: 'qrcode_slip', amount: 100 } },
      ];
      
      for (const endpoint of endpoints) {
        console.log(`\n2. Testing ${endpoint.path} endpoint...`);
        
        try {
          const createResponse = await fetch(`${PAYMENT_API_BASE}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Authorization': createAuthHeader(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(endpoint.body),
          });
          
          console.log(`${endpoint.path} status:`, createResponse.status);
          const createResponseText = await createResponse.text();
          console.log(`${endpoint.path} response:`, createResponseText);
          
          if (createResponse.status !== 404 && createResponse.status !== 400) {
            console.log(`✅ Found working endpoint: ${endpoint.path}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error testing ${endpoint.path}:`, error.message);
        }
      }
      
    } else {
      console.log('❌ API connection failed!');
      console.log('Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testPaymentAPI();