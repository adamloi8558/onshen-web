import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment';

export async function GET() {
  try {
    console.log('Testing payment API connection...');
    
    // Test API connection
    const userInfo = await PaymentService.getUserInfo();
    
    console.log('Payment API test successful:', userInfo);
    
    return NextResponse.json({
      success: true,
      message: 'API connection successful',
      userInfo: {
        username: userInfo.username,
        balance: userInfo.balance,
        webhook_url: userInfo.webhook_url
      }
    });
  } catch (error) {
    console.error('Payment API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'API connection failed'
    }, { status: 500 });
  }
}