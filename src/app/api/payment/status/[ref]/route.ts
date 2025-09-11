import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/lib/payment';

export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Get payment status
    const transaction = await PaymentService.getTransaction(params.ref);

    return NextResponse.json({
      success: true,
      ref: transaction.ref,
      amount: transaction.amount,
      status: transaction.status,
      created_at: transaction.created_at,
      paid_at: transaction.paid_at,
      expired_at: transaction.expired_at,
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'ไม่สามารถตรวจสอบสถานะได้'
      },
      { status: 500 }
    );
  }
}