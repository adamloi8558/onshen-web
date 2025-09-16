import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_API_BASE = 'https://barite.shengzhipay.com';
const PAYMENT_USERNAME = 'ronglakorn';
const PAYMENT_API_KEY = '3f17b5c0-7402-41cb-a2a2-dac94320dc22';

function createAuthHeader(): string {
  const credentials = `${PAYMENT_USERNAME}:${PAYMENT_API_KEY}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

export async function GET(request: NextRequest) {
  const testResults = [];
  
  try {
    // Test 1: Check /user/me (should work)
    console.log('🧪 Testing /user/me...');
    const userResponse = await fetch(`${PAYMENT_API_BASE}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    const userData = await userResponse.json();
    testResults.push({
      test: 'GET /user/me',
      status: userResponse.status,
      success: userResponse.ok,
      data: userData
    });
    
    // Test 2: Check transaction/create with different payloads
    const payloads = [
      { type: 'qrcode_slip', amount: 1 },
      { type: 'qrcode_tg', amount: 1 },
      { type: 'qrcode_slip', amount: 100.50 },
      { amount: 1, type: 'qrcode_slip' }, // different order
    ];
    
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      console.log(`🧪 Testing /transaction/create with payload ${i + 1}:`, payload);
      
      try {
        const transactionResponse = await fetch(`${PAYMENT_API_BASE}/transaction/create`, {
          method: 'POST',
          headers: {
            'Authorization': createAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        let responseData;
        try {
          responseData = await transactionResponse.json();
        } catch {
          responseData = await transactionResponse.text();
        }
        
        testResults.push({
          test: `POST /transaction/create (payload ${i + 1})`,
          payload: payload,
          status: transactionResponse.status,
          success: transactionResponse.ok,
          data: responseData,
          headers: Object.fromEntries(transactionResponse.headers.entries())
        });
        
        // If successful, break the loop
        if (transactionResponse.ok) {
          console.log('✅ Found working payload!', payload);
          break;
        }
        
      } catch (error) {
        testResults.push({
          test: `POST /transaction/create (payload ${i + 1})`,
          payload: payload,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Test 3: Check if credentials are correct by testing different auth
    console.log('🧪 Testing different auth formats...');
    const authTests = [
      createAuthHeader(),
      `Bearer ${PAYMENT_API_KEY}`,
      `Token ${PAYMENT_API_KEY}`,
    ];
    
    for (let i = 0; i < authTests.length; i++) {
      const auth = authTests[i];
      console.log(`🧪 Testing auth format ${i + 1}:`, auth.substring(0, 20) + '...');
      
      try {
        const authResponse = await fetch(`${PAYMENT_API_BASE}/user/me`, {
          method: 'GET',
          headers: {
            'Authorization': auth,
            'Content-Type': 'application/json',
          },
        });
        
        const authData = await authResponse.json();
        testResults.push({
          test: `Auth test ${i + 1}`,
          authType: auth.split(' ')[0],
          status: authResponse.status,
          success: authResponse.ok,
          data: authData
        });
        
      } catch (error) {
        testResults.push({
          test: `Auth test ${i + 1}`,
          authType: auth.split(' ')[0],
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      message: 'Detailed testing completed',
      credentials: {
        username: PAYMENT_USERNAME,
        apiKeyPrefix: PAYMENT_API_KEY.substring(0, 8) + '...',
        baseUrl: PAYMENT_API_BASE
      },
      results: testResults,
      summary: {
        total: testResults.length,
        successful: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Detailed test failed',
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
