import { NextResponse } from 'next/server';

const PAYMENT_API_BASE = 'https://barite.shengzhipay.com';
const PAYMENT_USERNAME = 'ronglakorn';
const PAYMENT_API_KEY = '3f17b5c0-7402-41cb-a2a2-dac94320dc22';

function createAuthHeader(): string {
  const credentials = `${PAYMENT_USERNAME}:${PAYMENT_API_KEY}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

export async function GET() {
  const results = [];
  
  try {
    // Step 1: Set webhook URL
    console.log('🔧 Setting up webhook URL...');
    const webhookUrl = 'https://ronglakorn.com/api/payment/webhook';
    
    const webhookResponse = await fetch(`${PAYMENT_API_BASE}/user/edit`, {
      method: 'PUT',
      headers: {
        'Authorization': createAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_url: webhookUrl
      })
    });
    
    const webhookData = await webhookResponse.json();
    results.push({
      step: 'Set Webhook URL',
      status: webhookResponse.status,
      success: webhookResponse.ok,
      data: webhookData,
      url: webhookUrl
    });
    
    console.log('🔧 Webhook setup result:', webhookResponse.status, webhookData);
    
    // Step 2: Verify webhook was set
    console.log('🔍 Verifying webhook setup...');
    const verifyResponse = await fetch(`${PAYMENT_API_BASE}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    const verifyData = await verifyResponse.json();
    results.push({
      step: 'Verify Webhook',
      status: verifyResponse.status,
      success: verifyResponse.ok,
      data: verifyData,
      webhookSet: !!verifyData.webhook_url
    });
    
    console.log('🔍 Webhook verification:', verifyData);
    
    // Step 3: Try creating transaction now
    if (webhookResponse.ok || verifyData.webhook_url) {
      console.log('🎯 Attempting transaction creation...');
      
      const transactionResponse = await fetch(`${PAYMENT_API_BASE}/transaction/create`, {
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
      
      let transactionData;
      try {
        transactionData = await transactionResponse.json();
      } catch {
        transactionData = await transactionResponse.text();
      }
      
      results.push({
        step: 'Create Transaction',
        status: transactionResponse.status,
        success: transactionResponse.ok,
        data: transactionData,
        payload: { type: 'qrcode_slip', amount: 1 }
      });
      
      console.log('🎯 Transaction creation result:', transactionResponse.status, transactionData);
      
      // Step 4: Try qrcode_tg as well
      console.log('🎯 Attempting qrcode_tg transaction...');
      
      const tgResponse = await fetch(`${PAYMENT_API_BASE}/transaction/create`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'qrcode_tg',
          amount: 1
        })
      });
      
      let tgData;
      try {
        tgData = await tgResponse.json();
      } catch {
        tgData = await tgResponse.text();
      }
      
      results.push({
        step: 'Create TG Transaction',
        status: tgResponse.status,
        success: tgResponse.ok,
        data: tgData,
        payload: { type: 'qrcode_tg', amount: 1 }
      });
      
      console.log('🎯 TG Transaction result:', tgResponse.status, tgData);
    }
    
    return NextResponse.json({
      message: 'Setup and testing completed',
      webhook_url: webhookUrl,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        webhookConfigured: results.some(r => r.step === 'Verify Webhook' && r.webhookSet),
        transactionWorking: results.some(r => r.step.includes('Transaction') && r.success)
      }
    });
    
  } catch (error) {
    console.error('❌ Setup and test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Setup and test failed',
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      results
    }, { status: 500 });
  }
}
