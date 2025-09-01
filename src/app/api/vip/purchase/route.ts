import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const VIP_PRICE_COINS = 39; // 39 เหรียญ = 39 บาท
const VIP_DURATION_DAYS = 30; // 30 วัน

export async function POST() {
  try {
    const user = await requireAuth();

    // Get current user data
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
    await db
      .update(users)
      .set({
        coins: currentUser.coins - VIP_PRICE_COINS,
        is_vip: true,
        vip_expires_at: vipExpiresAt,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    // Record transaction
    await db
      .insert(transactions)
      .values({
        user_id: user.id,
        type: 'vip_purchase',
        status: 'completed',
        amount: VIP_PRICE_COINS.toString(),
        coins: -VIP_PRICE_COINS, // Negative because coins were spent
        description: `สมัครสมาชิก VIP ${VIP_DURATION_DAYS} วัน`,
        payment_method: 'coins',
        payment_reference: `VIP${Date.now()}`,
        processed_at: new Date(),
      });

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
    console.error('VIP purchase error:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก VIP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}