import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db, transactions } from '@/lib/db';
import { z } from 'zod';

const linkPaymentSchema = z.object({
  ref: z.string(),
  amount: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { ref, amount } = linkPaymentSchema.parse(body);

    // Store payment reference linked to user
    await db.insert(transactions).values({
      user_id: user.id,
      type: 'topup',
      amount: amount.toString(),
      description: `เติมเงินผ่าน Payment Gateway (${ref})`,
      payment_ref: ref,
      status: 'pending',
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'เชื่อมรายการชำระเงินสำเร็จ'
    });

  } catch (error) {
    console.error('Link payment error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเชื่อมรายการ' },
      { status: 500 }
    );
  }
}