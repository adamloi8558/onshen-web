import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    // Get first non-admin user for testing
    const [testUser] = await db
      .select({
        id: users.id,
        phone: users.phone,
        role: users.role,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.role, 'user'))
      .limit(1);

    if (!testUser) {
      return NextResponse.json({
        error: 'No test user found',
        message: 'Create a regular user first to test edit functionality'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User edit test ready',
      data: {
        testUser,
        editUrl: `/admin/users/${testUser.id}/edit`,
        transactionsUrl: `/admin/users/${testUser.id}/transactions`,
        apiUrl: `/api/admin/users/${testUser.id}`
      }
    });

  } catch (error) {
    console.error('Test user edit error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}