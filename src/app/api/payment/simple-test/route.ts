import { NextResponse } from 'next/server';

// Simple test without using PaymentService class
const PAYMENT_API_BASE = 'https://barite.shengzhipay.com';
const PAYMENT_USERNAME = 'ronglakorn';
const PAYMENT_API_KEY = '3f17b5c0-7402-41cb-a2a2-dac94320dc22';

function createAuthHeader(): string {
  const credentials = `${PAYMENT_USERNAME}:${PAYMENT_API_KEY}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

export async function GET() {
  try {
    console.log('🧪 Simple Payment API Test Starting...');
    
    // Test 1: Check if we can reach the API
    const testUrl = `${PAYMENT_API_BASE}/user/me`;
    console.log('🧪 Testing URL:', testUrl);
    console.log('🧪 Auth Header:', createAuthHeader().substring(0, 20) + '...');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🧪 Response Status:', response.status);
    console.log('🧪 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    let responseData;
    try {
      responseData = await response.json();
      console.log('🧪 Response Data:', responseData);
    } catch {
      const textData = await response.text();
      console.log('🧪 Response Text:', textData);
      responseData = { raw: textData };
    }
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Payment API connection successful',
        status: response.status,
        data: responseData
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment API returned error',
        status: response.status,
        error: responseData,
        debug: {
          url: testUrl,
          method: 'GET',
          hasAuth: true
        }
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('🧪 Simple test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Payment API',
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
