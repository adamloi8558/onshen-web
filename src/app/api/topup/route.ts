import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const topupSchema = z.object({
  amount: z.number().min(50, 'จำนวนเงินขั้นต่ำ 50 บาท').max(50000, 'จำนวนเงินสูงสุด 50,000 บาท'),
  method: z.enum(['credit', 'wallet', 'qr'], {
    errorMap: () => ({ message: 'วิธีการชำระเงินไม่ถูกต้อง' })
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    const body = await req.json();
    const { amount, method } = topupSchema.parse(body);

    // Mock payment processing
    // ในระบบจริงจะเชื่อมต่อกับ Payment Gateway
    const paymentReference = `TOP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock payment success (90% success rate)
    const isPaymentSuccess = Math.random() > 0.1;
    
    if (!isPaymentSuccess) {
      return NextResponse.json(
        { error: 'การชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    // Update user coins and balance
    const coinsToAdd = amount; // 1 บาท = 1 coin
    const currentBalance = parseFloat((await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0]?.balance || '0');
    const newBalance = currentBalance + amount;

    await db
      .update(users)
      .set({
        coins: user.coins + coinsToAdd,
        balance: newBalance.toString(),
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    // Record transaction
    await db
      .insert(transactions)
      .values({
        user_id: user.id,
        type: 'topup',
        status: 'completed',
        amount: amount.toString(),
        coins: coinsToAdd,
        description: `เติมเงิน ${amount} บาท`,
        payment_method: method,
        payment_reference: paymentReference,
        processed_at: new Date(),
      });

    return NextResponse.json({ 
      success: true, 
      message: `เติมเงินสำเร็จ! ได้รับ ${coinsToAdd} Coins`,
      data: {
        amount,
        coins: coinsToAdd,
        reference: paymentReference,
        new_balance: newBalance,
        new_coins: user.coins + coinsToAdd,
      }
    });

  } catch (error) {
    console.error('Topup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเติมเงิน' },
      { status: 500 }
    );
  }
}