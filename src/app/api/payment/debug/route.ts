import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Payment Debug: Starting comprehensive test...');
    
    // Test 1: Environment Check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    };
    console.log('🔍 Environment Check:', envCheck);

    // Test 2: Payment Service Connection Test
    console.log('🔍 Testing Payment Service...');
    
    try {
      // Test getUserInfo first (simpler endpoint)
      console.log('🔍 Testing getUserInfo...');
      const userInfo = await PaymentService.getUserInfo();
      console.log('✅ getUserInfo success:', userInfo);
      
      // Test createTransaction with small amount
      console.log('🔍 Testing createTransaction...');
      const transaction = await PaymentService.createTransaction(1, 'qrcode_slip');
      console.log('✅ createTransaction success:', transaction);
      
      return NextResponse.json({
        success: true,
        message: 'Payment API working correctly',
        tests: {
          environment: envCheck,
          userInfo: userInfo,
          transaction: {
            ref: transaction.ref,
            amount: transaction.amount,
            hasQrcode: !!transaction.qrcode
          }
        }
      });
      
    } catch (paymentError) {
      console.error('❌ Payment Service Error:', paymentError);
      
      return NextResponse.json({
        success: false,
        message: 'Payment API connection failed',
        error: {
          message: paymentError instanceof Error ? paymentError.message : String(paymentError),
          type: paymentError instanceof Error ? paymentError.constructor.name : 'Unknown'
        },
        tests: {
          environment: envCheck,
          paymentApi: 'FAILED'
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Debug endpoint failed',
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
