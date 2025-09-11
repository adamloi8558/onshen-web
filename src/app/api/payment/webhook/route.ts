import { NextRequest, NextResponse } from 'next/server';
import { db, users, transactions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature } from '@/lib/payment';
import { z } from 'zod';

const webhookSchema = z.object({
  event: z.enum(['created', 'paid', 'expired', 'cancelled', 'error']),
  ref: z.string(),
  amount: z.number(),
  status: z.string(),
  paid_at: z.string().nullable().optional(),
  signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);

    // Validate webhook data
    const webhookData = webhookSchema.parse(body);

    // Verify signature
    if (!verifyWebhookSignature(webhookData.ref, webhookData.signature)) {
      console.error('Invalid webhook signature:', {
        ref: webhookData.ref,
        receivedSignature: webhookData.signature,
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle payment events
    switch (webhookData.event) {
      case 'paid':
        await handlePaymentPaid(webhookData);
        break;
      case 'expired':
      case 'cancelled':
      case 'error':
        await handlePaymentFailed(webhookData);
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentPaid(webhookData: z.infer<typeof webhookSchema>) {
  try {
    console.log('Payment completed:', {
      ref: webhookData.ref,
      amount: webhookData.amount,
      paid_at: webhookData.paid_at,
    });

    // Find pending transaction by payment ref
    const [transaction] = await db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        status: transactions.status,
      })
      .from(transactions)
      .where(eq(transactions.payment_ref, webhookData.ref))
      .limit(1);

    if (!transaction) {
      console.error('Transaction not found for ref:', webhookData.ref);
      return;
    }

    if (transaction.status !== 'pending') {
      console.log('Transaction already processed:', transaction.id);
      return;
    }

    // Update transaction status
    await db
      .update(transactions)
      .set({
        status: 'completed',
        processed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(transactions.id, transaction.id));

    // Add coins to user
    const coinsToAdd = Math.floor(webhookData.amount); // 1 บาท = 1 เหรียญ
    
    await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${coinsToAdd}`,
        updated_at: new Date(),
      })
      .where(eq(users.id, transaction.user_id));

    console.log(`Added ${coinsToAdd} coins to user ${transaction.user_id} for payment ${webhookData.ref}`);

  } catch (error) {
    console.error('Error handling payment completion:', error);
    throw error;
  }
}

async function handlePaymentFailed(webhookData: z.infer<typeof webhookSchema>) {
  try {
    console.log('Payment failed/expired/cancelled:', {
      ref: webhookData.ref,
      status: webhookData.status,
      event: webhookData.event,
    });

    // Handle payment failure
    // Clean up any pending records if needed

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}