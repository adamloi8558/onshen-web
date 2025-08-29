import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  coins: z.number().min(0).optional(),
  balance: z.number().min(0).optional(),
  is_vip: z.boolean().optional(),
  vip_expires_at: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const [user] = await db
      .select({
        id: users.id,
        phone: users.phone,
        avatar_url: users.avatar_url,
        role: users.role,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
        last_login_at: users.last_login_at,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: user 
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }

    if (validatedData.coins !== undefined) {
      updateData.coins = validatedData.coins;
    }

    if (validatedData.balance !== undefined) {
      updateData.balance = validatedData.balance.toString();
    }

    if (validatedData.is_vip !== undefined) {
      updateData.is_vip = validatedData.is_vip;
    }

    if (validatedData.vip_expires_at !== undefined) {
      updateData.vip_expires_at = validatedData.vip_expires_at 
        ? new Date(validatedData.vip_expires_at)
        : null;
    }

    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    // Update user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, params.id));

    // Get updated user data
    const [updatedUser] = await db
      .select({
        id: users.id,
        phone: users.phone,
        avatar_url: users.avatar_url,
        role: users.role,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    return NextResponse.json({ 
      success: true, 
      message: 'อัพเดตข้อมูลผู้ใช้สำเร็จ',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // Check if user exists
    const [existingUser] = await db
      .select({ 
        id: users.id, 
        role: users.role 
      })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    // Prevent deleting admin users (optional safety check)
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบผู้ดูแลระบบได้' },
        { status: 403 }
      );
    }

    // Delete user (cascade will handle related records)
    await db
      .delete(users)
      .where(eq(users.id, params.id));

    return NextResponse.json({ 
      success: true, 
      message: 'ลบผู้ใช้สำเร็จ' 
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' },
      { status: 500 }
    );
  }
}