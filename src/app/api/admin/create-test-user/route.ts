import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await requireAdmin();

    const testPhone = '0999999999';
    
    // Check if test user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, testPhone))
      .limit(1);

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        data: {
          phone: testPhone,
          editUrl: `/admin/users/${existingUser.id}/edit`
        }
      });
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('testuser123', 12);
    
    const [newUser] = await db
      .insert(users)
      .values({
        phone: testPhone,
        password_hash: hashedPassword,
        role: 'user',
        coins: 100,
        balance: '50.00',
        is_vip: false,
        avatar_url: '/avatars/default.webp',
        reset_otp: null,
        reset_otp_expires: null,
      })
      .returning({
        id: users.id,
        phone: users.phone,
        role: users.role,
        coins: users.coins,
      });

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      data: {
        user: newUser,
        credentials: {
          phone: testPhone,
          password: 'testuser123'
        },
        editUrl: `/admin/users/${newUser.id}/edit`,
        transactionsUrl: `/admin/users/${newUser.id}/transactions`
      }
    });

  } catch (error) {
    console.error('Create test user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test user', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}