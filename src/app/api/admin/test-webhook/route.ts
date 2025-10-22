import { NextRequest, NextResponse } from 'next/server';
import { createWebhookSignature } from '@/lib/payment';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ref, amount, event } = body;

    if (!ref || !amount) {
      return NextResponse.json(
        { error: 'Missing ref or amount' },
        { status: 400 }
      );
    }

    // Create signature
    const signature = await createWebhookSignature(ref);

    // Send webhook to our own endpoint
    const webhookPayload = {
      event: event || 'paid',
      ref: ref,
      amount: parseFloat(amount),
      status: 'paid',
      paid_at: new Date().toISOString(),
      signature: signature
    };

    console.log('🧪 Manual webhook trigger:', webhookPayload);

    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Manual webhook triggered',
      payload: webhookPayload,
      webhookResponse: webhookResult,
      webhookStatus: webhookResponse.status
    });

  } catch (error) {
    console.error('Manual webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger webhook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

