import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, users, transactions } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { ref } = body;

    if (!ref) {
      return NextResponse.json(
        { error: 'Missing payment reference' },
        { status: 400 }
      );
    }

    console.log('🔧 Manual payment confirmation for ref:', ref);

    // Find transaction by payment_ref
    const [transaction] = await db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        status: transactions.status,
      })
      .from(transactions)
      .where(eq(transactions.payment_ref, ref))
      .limit(1);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status === 'completed') {
      return NextResponse.json(
        { error: 'Transaction already completed' },
        { status: 400 }
      );
    }

    // Update transaction to completed
    await db
      .update(transactions)
      .set({
        status: 'completed',
        processed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(transactions.id, transaction.id));

    // Add coins to user
    const coinsToAdd = Math.floor(parseFloat(transaction.amount));
    
    await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${coinsToAdd}`,
        updated_at: new Date(),
      })
      .where(eq(users.id, transaction.user_id));

    console.log(`✅ Manually confirmed payment: Added ${coinsToAdd} coins to user ${transaction.user_id}`);

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed manually',
      coinsAdded: coinsToAdd,
      transactionId: transaction.id
    });

  } catch (error) {
    console.error('Manual payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
