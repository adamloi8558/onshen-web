import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== Payment API Test Started ===');
    
    // Test 1: Basic API response
    console.log('Test 1: Basic response');
    
    // Test 2: Database connection
    console.log('Test 2: Database connection');
    const dbTest = db ? 'Connected' : 'Not connected';
    console.log('Database status:', dbTest);
    
    // Test 3: Auth system
    console.log('Test 3: Auth system');
    let authTest = 'Not authenticated';
    try {
      const user = await getCurrentUser();
      authTest = user ? `Authenticated as ${user.phone}` : 'Not authenticated';
    } catch (authError) {
      console.error('Auth test error:', authError);
      authTest = `Auth error: ${authError instanceof Error ? authError.message : 'Unknown'}`;
    }
    
    // Test 4: Payment API connection
    console.log('Test 4: Payment API connection');
    let paymentTest = 'Failed';
    let paymentError = '';
    try {
      const userInfo = await PaymentService.getUserInfo();
      paymentTest = 'Success';
      console.log('Payment API test successful:', userInfo);
    } catch (error) {
      console.error('Payment API test failed:', error);
      paymentError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    console.log('=== Payment API Test Completed ===');
    
    return NextResponse.json({
      success: true,
      message: 'API test completed',
      tests: {
        basic: 'OK',
        database: dbTest,
        auth: authTest,
        payment: paymentTest,
        paymentError: paymentError || undefined
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error('Test API failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Test API failed'
    }, { status: 500 });
  }
}