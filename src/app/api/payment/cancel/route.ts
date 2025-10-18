import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db, transactions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ref } = body;

    if (!ref) {
      return NextResponse.json(
        { error: 'Missing payment reference' },
        { status: 400 }
      );
    }

    // Find and cancel the transaction
    const [transaction] = await db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        status: transactions.status,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.payment_ref, ref),
          eq(transactions.user_id, user.id)
        )
      )
      .limit(1);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending transactions' },
        { status: 400 }
      );
    }

    // Update to cancelled
    await db
      .update(transactions)
      .set({
        status: 'cancelled',
        updated_at: new Date(),
      })
      .where(eq(transactions.id, transaction.id));

    return NextResponse.json({
      success: true,
      message: 'ยกเลิกรายการเรียบร้อย'
    });

  } catch (error) {
    console.error('Cancel payment error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยกเลิกรายการ' },
      { status: 500 }
    );
  }
}
