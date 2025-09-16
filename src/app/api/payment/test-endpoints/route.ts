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
  const testEndpoints = [
    '/transaction/create',
    '/transaction',
    '/transactions/create', 
    '/transactions',
    '/create-transaction',
    '/payment/create',
    '/qr/create'
  ];
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`🧪 Testing endpoint: ${PAYMENT_API_BASE}${endpoint}`);
      
      const response = await fetch(`${PAYMENT_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'qrcode_slip', 
          amount: 1 
        })
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
      
      results.push({
        endpoint,
        status: response.status,
        success: response.ok,
        data: responseData
      });
      
      console.log(`🧪 ${endpoint}: ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      results.push({
        endpoint,
        status: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`🧪 ${endpoint}: ERROR - ${error}`);
    }
  }
  
  return NextResponse.json({
    message: 'Endpoint testing completed',
    results,
    summary: {
      total: testEndpoints.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
}
