import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const createContentSchema = z.object({
  title: z.string().min(1, 'กรุณาใส่ชื่อเรื่อง'),
  slug: z.string().min(1, 'กรุณาใส่ slug'),
  description: z.string().optional(),
  type: z.enum(['movie', 'series']),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  content_rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17']).default('PG'),
  category_id: z.string().optional(),
  is_vip_required: z.boolean().default(false),
  duration_minutes: z.number().optional(),
  total_episodes: z.number().optional(),
  release_date: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createContentSchema.parse(body);

    // Check if slug already exists
    const existingContent = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.slug, validatedData.slug))
      .limit(1);

    if (existingContent.length > 0) {
      return NextResponse.json(
        { error: 'Slug นี้ถูกใช้แล้ว' },
        { status: 400 }
      );
    }

    // Create content
    const [newContent] = await db
      .insert(content)
      .values({
        title: validatedData.title,
        slug: validatedData.slug,
        description: validatedData.description || null,
        type: validatedData.type,
        status: validatedData.status,
        content_rating: validatedData.content_rating,
        category_id: validatedData.category_id || null,
        is_vip_required: validatedData.is_vip_required,
        duration_minutes: validatedData.duration_minutes || null,
        total_episodes: validatedData.total_episodes || null,
        release_date: validatedData.release_date ? new Date(validatedData.release_date) : null,
        views: 0,
        saves: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning({
        id: content.id,
        title: content.title,
        slug: content.slug,
        type: content.type,
        status: content.status,
      });

    return NextResponse.json({
      success: true,
      message: 'เพิ่มเนื้อหาสำเร็จ',
      content: newContent,
    });

  } catch (error) {
    console.error('Create content error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มเนื้อหา' },
      { status: 500 }
    );
  }
}