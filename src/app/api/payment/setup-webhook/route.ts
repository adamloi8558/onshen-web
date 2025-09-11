import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { PaymentService } from '@/lib/payment';

export async function POST() {
  try {
    // Only admin can setup webhook
    await requireAdmin();

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}api/payment/webhook`;
    
    const result = await PaymentService.updateWebhookUrl(webhookUrl);

    return NextResponse.json({
      success: true,
      webhook_url: webhookUrl,
      message: 'ตั้งค่า Webhook URL สำเร็จ',
      user_info: result.user,
    });

  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'ไม่สามารถตั้งค่า Webhook ได้'
      },
      { status: 500 }
    );
  }
}