import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const VIP_PRICE_COINS = 39; // 39 เหรียญ = 39 บาท
const VIP_DURATION_DAYS = 30; // 30 วัน

export async function POST(request: Request) {
  try {
    console.log('🔍 VIP Purchase: Starting process...');
    const user = await requireAuth();
    console.log('🔍 VIP Purchase: User authenticated:', user.id);

    // Parse request body to ensure it's intentional
    const body = await request.json().catch(() => ({}));
    console.log('🔍 VIP Purchase: Request body:', body);

    // Require confirmation token to prevent accidental purchases
    if (!body.confirmed || body.confirmed !== 'I_CONFIRM_VIP_PURCHASE') {
      console.log('🚨 VIP Purchase: Missing or invalid confirmation token');
      return NextResponse.json(
        { 
          error: 'การยืนยันไม่ถูกต้อง',
          details: 'กรุณายืนยันการซื้อผ่านหน้าเว็บ'
        },
        { status: 400 }
      );
    }

    // Get current user data
    console.log('🔍 VIP Purchase: Fetching user data...');
    const [currentUser] = await db
      .select({
        id: users.id,
        phone: users.phone,
        coins: users.coins,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    console.log('🔍 VIP Purchase: Current user data:', currentUser);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // Check if user has enough coins
    if (currentUser.coins < VIP_PRICE_COINS) {
      return NextResponse.json(
        { 
          error: 'เหรียญไม่เพียงพอ',
          details: `ต้องการ ${VIP_PRICE_COINS} เหรียญ แต่คุณมี ${currentUser.coins} เหรียญ`,
          shortfall: VIP_PRICE_COINS - currentUser.coins
        },
        { status: 400 }
      );
    }

    // Check if user is already VIP and not expired
    const now = new Date();
    if (currentUser.is_vip && currentUser.vip_expires_at && currentUser.vip_expires_at > now) {
      return NextResponse.json(
        { 
          error: 'คุณเป็นสมาชิก VIP อยู่แล้ว',
          details: `VIP หมดอายุ: ${currentUser.vip_expires_at.toLocaleDateString('th-TH')}`,
          vip_expires_at: currentUser.vip_expires_at
        },
        { status: 400 }
      );
    }

    // Calculate new VIP expiration date
    const vipExpiresAt = new Date();
    if (currentUser.is_vip && currentUser.vip_expires_at && currentUser.vip_expires_at > now) {
      // Extend existing VIP
      vipExpiresAt.setTime(currentUser.vip_expires_at.getTime() + (VIP_DURATION_DAYS * 24 * 60 * 60 * 1000));
    } else {
      // New VIP or expired VIP
      vipExpiresAt.setDate(vipExpiresAt.getDate() + VIP_DURATION_DAYS);
    }

    // Update user: deduct coins, set VIP status, set expiration
    console.log('🔍 VIP Purchase: Updating user...', {
      userId: user.id,
      currentCoins: currentUser.coins,
      newCoins: currentUser.coins - VIP_PRICE_COINS,
      vipExpiresAt
    });
    
    await db
      .update(users)
      .set({
        coins: currentUser.coins - VIP_PRICE_COINS,
        is_vip: true,
        vip_expires_at: vipExpiresAt,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log('🔍 VIP Purchase: User updated successfully');

    // Record transaction
    console.log('🔍 VIP Purchase: Recording transaction...');
    await db
      .insert(transactions)
      .values({
        user_id: user.id,
        type: 'vip_purchase',
        status: 'completed',
        amount: VIP_PRICE_COINS.toString(),
        description: `สมัครสมาชิก VIP ${VIP_DURATION_DAYS} วัน`,
        processed_at: new Date(),
      });
    console.log('🔍 VIP Purchase: Transaction recorded successfully');

    console.log('VIP purchase successful:', {
      userId: user.id,
      coinsSpent: VIP_PRICE_COINS,
      newCoins: currentUser.coins - VIP_PRICE_COINS,
      vipExpiresAt
    });

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิก VIP สำเร็จ!',
      data: {
        coinsSpent: VIP_PRICE_COINS,
        remainingCoins: currentUser.coins - VIP_PRICE_COINS,
        vipExpiresAt: vipExpiresAt,
        vipDuration: `${VIP_DURATION_DAYS} วัน`,
        benefits: [
          'เข้าถึงเนื้อหาพรีเมียมทั้งหมด',
          'ไม่มีโฆษณาขณะดู',
          'คุณภาพ HD และ 4K',
          'ดูได้ก่อนใครตลอด 24 ชั่วโมง',
          'อัปโหลดเนื้อหาโปรดส่วนตัว'
        ]
      }
    });

  } catch (error) {
    console.error('🚨 VIP purchase error:', error);
    console.error('🚨 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก VIP',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined,
        debug: process.env.NODE_ENV === 'development' ? {
          errorName: error instanceof Error ? error.name : 'Unknown',
          timestamp: new Date().toISOString()
        } : undefined
      },
      { status: 500 }
    );
  }
}