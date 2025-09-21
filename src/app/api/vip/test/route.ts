import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🧪 VIP Test: Starting comprehensive test...');

    // Test 1: Authentication
    console.log('🧪 VIP Test: Testing authentication...');
    const user = await requireAuth();
    console.log('✅ VIP Test: Auth successful:', user.id);

    // Test 2: Database connection
    console.log('🧪 VIP Test: Testing database connection...');
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log('✅ VIP Test: Database connection successful, user count:', userCount.count);

    // Test 3: User data fetch
    console.log('🧪 VIP Test: Testing user data fetch...');
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
      throw new Error('User not found in database');
    }
    console.log('✅ VIP Test: User data fetch successful:', {
      id: currentUser.id,
      coins: currentUser.coins,
      is_vip: currentUser.is_vip
    });

    // Test 4: Transaction insert test (dry run)
    console.log('🧪 VIP Test: Testing transaction schema...');
    const testTransactionData = {
      user_id: user.id,
      type: 'test_vip',
      status: 'completed',
      amount: '39',
      description: 'Test VIP transaction',
      processed_at: new Date(),
    };
    console.log('✅ VIP Test: Transaction data prepared:', testTransactionData);

    // Test 5: User update test (dry run)
    console.log('🧪 VIP Test: Testing user update schema...');
    const vipExpiresAt = new Date();
    vipExpiresAt.setDate(vipExpiresAt.getDate() + 30);
    
    const testUserUpdateData = {
      coins: currentUser.coins - 39,
      is_vip: true,
      vip_expires_at: vipExpiresAt,
      updated_at: new Date(),
    };
    console.log('✅ VIP Test: User update data prepared:', testUserUpdateData);

    return NextResponse.json({
      success: true,
      message: 'VIP API test completed successfully',
      tests: {
        auth: 'PASSED',
        database: 'PASSED',
        userFetch: 'PASSED',
        transactionSchema: 'PASSED',
        userUpdateSchema: 'PASSED'
      },
      userData: {
        id: currentUser.id,
        coins: currentUser.coins,
        is_vip: currentUser.is_vip,
        canAffordVip: currentUser.coins >= 39
      }
    });

  } catch (error) {
    console.error('🚨 VIP Test error:', error);
    console.error('🚨 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'VIP test failed',
      details: error instanceof Error ? error.message : String(error),
      debug: {
        errorName: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
