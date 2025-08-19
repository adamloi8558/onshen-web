import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db, categories } from '@/lib/db';
import { eq } from 'drizzle-orm';

const createCategorySchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อหมวดหมู่'),
  slug: z.string().min(1, 'กรุณาใส่ slug'),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if slug already exists
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Slug นี้มีอยู่แล้ว กรุณาใช้ slug อื่น' },
        { status: 400 }
      );
    }

    // Create new category
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || `หมวดหมู่${validatedData.name}`,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'สร้างหมวดหมู่สำเร็จ',
      category: newCategory,
    });

  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' },
      { status: 500 }
    );
  }
}