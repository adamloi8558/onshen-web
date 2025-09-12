import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/lib/payment';
import { z } from 'zod';

const createPaymentSchema = z.object({
  amount: z.number().min(1, 'จำนวนเงินต้องมากกว่า 0').max(10000, 'จำนวนเงินสูงสุด 10,000 บาท'),
  type: z.enum(['qrcode_tg', 'qrcode_slip']).default('qrcode_slip'),
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Create payment transaction
    const paymentResult = await PaymentService.createTransaction(
      validatedData.amount,
      validatedData.type
    );

    return NextResponse.json({
      success: true,
      qrcode: paymentResult.qrcode,
      ref: paymentResult.ref,
      amount: paymentResult.amount,
      message: 'สร้างรายการชำระเงินสำเร็จ'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Extract meaningful error message
    let errorMessage = 'เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน';
    if (error instanceof Error) {
      if (error.message.includes('Payment API error')) {
        errorMessage = 'ไม่สามารถเชื่อมต่อระบบชำระเงินได้ กรุณาลองใหม่อีกครั้ง';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'เกิดปัญหาการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}