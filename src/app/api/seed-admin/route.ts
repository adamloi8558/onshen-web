import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🌱 Creating admin user...');

    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.phone, '0800000000'))
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        phone: '0800000000',
        timestamp: new Date().toISOString() 
      });
    }

    // Create admin user
    const adminPassword = await hashPassword('@@GGRocker123zazaza!');
    
    await db.insert(users).values({
      phone: '0800000000',
      password_hash: adminPassword,
      avatar_url: '/avatars/default.webp',
      role: 'admin',
      coins: 1000,
      balance: '100.00',
      is_vip: true,
      vip_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Admin user created');
    
    return NextResponse.json({ 
      success: true,
      message: 'Admin user created successfully',
      phone: '0800000000',
      password: '@@GGRocker123zazaza!',
      timestamp: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}