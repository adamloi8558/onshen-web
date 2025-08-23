import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  avatar_url: z.string().url().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    const body = await req.json();
    const { avatar_url } = updateProfileSchema.parse(body);

    const updateData: { updated_at: Date; avatar_url?: string } = {
      updated_at: new Date(),
    };

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    return NextResponse.json({ 
      success: true, 
      message: 'อัพเดตโปรไฟล์สำเร็จ' 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดตโปรไฟล์' },
      { status: 500 }
    );
  }
}