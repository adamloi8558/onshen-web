import { NextResponse } from 'next/server';
import { db, transactions } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🕐 Running payment expiration cron job...');
    
    // Find pending transactions older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const expiredTransactions = await db
      .select({
        id: transactions.id,
        payment_ref: transactions.payment_ref,
        amount: transactions.amount,
        created_at: transactions.created_at,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'topup'),
          eq(transactions.status, 'pending'),
          sql`${transactions.created_at} < ${fifteenMinutesAgo.toISOString()}::timestamp`
        )
      )
      .limit(100);

    console.log(`Found ${expiredTransactions.length} expired transactions`);

    // Update them to expired
    for (const transaction of expiredTransactions) {
      await db
        .update(transactions)
        .set({
          status: 'failed',
          updated_at: new Date(),
        })
        .where(eq(transactions.id, transaction.id));
      
      console.log(`Expired transaction: ${transaction.payment_ref}`);
    }

    return NextResponse.json({
      success: true,
      expired: expiredTransactions.length,
      message: `Expired ${expiredTransactions.length} transactions`,
    });

  } catch (error) {
    console.error('Error expiring payments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

