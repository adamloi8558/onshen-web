import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateContentSchema = z.object({
  title: z.string().min(1, 'กรุณาใส่ชื่อเรื่อง').optional(),
  slug: z.string().min(1, 'กรุณาใส่ slug').optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['movie', 'series']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  content_rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17']).optional(),
  category_id: z.string().nullable().optional().transform(val => val === "" ? null : val),
  is_vip_required: z.boolean().optional(),
  duration_minutes: z.number().nullable().optional(),
  total_episodes: z.number().nullable().optional(),
  release_date: z.string().nullable().optional().transform(val => val === "" ? null : val),
  poster_url: z.string().nullable().optional().transform(val => val === "" ? null : val),
  backdrop_url: z.string().nullable().optional().transform(val => val === "" ? null : val),
  trailer_url: z.string().nullable().optional().transform(val => val === "" ? null : val),
  video_url: z.string().nullable().optional().transform(val => val === "" ? null : val),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const [contentItem] = await db
      .select()
      .from(content)
      .where(eq(content.id, params.id))
      .limit(1);

    if (!contentItem) {
      return NextResponse.json(
        { error: 'ไม่พบเนื้อหา' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: contentItem 
    });

  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเนื้อหา' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await req.json();
    console.log('Update content body:', JSON.stringify(body, null, 2));
    
    const validatedData = updateContentSchema.parse(body);
    console.log('Validated update data:', JSON.stringify(validatedData, null, 2));

    // Check if content exists
    const [existingContent] = await db
      .select({ id: content.id, slug: content.slug })
      .from(content)
      .where(eq(content.id, params.id))
      .limit(1);

    if (!existingContent) {
      return NextResponse.json(
        { error: 'ไม่พบเนื้อหา' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and already exists
    if (validatedData.slug && validatedData.slug !== existingContent.slug) {
      const [slugExists] = await db
        .select({ id: content.id })
        .from(content)
        .where(eq(content.slug, validatedData.slug))
        .limit(1);

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug นี้ถูกใช้แล้ว' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'release_date' && value) {
          updateData[key] = new Date(value as string);
        } else {
          updateData[key] = value;
        }
      }
    });

    // Update content
    const [updatedContent] = await db
      .update(content)
      .set(updateData)
      .where(eq(content.id, params.id))
      .returning({
        id: content.id,
        title: content.title,
        slug: content.slug,
        type: content.type,
        status: content.status,
      });

    console.log('Content updated successfully:', updatedContent);

    return NextResponse.json({ 
      success: true, 
      message: 'อัพเดตเนื้อหาสำเร็จ',
      data: updatedContent
    });

  } catch (error) {
    console.error('Update content error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้อง', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการอัพเดตเนื้อหา',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Check if content exists
    const [existingContent] = await db
      .select({ 
        id: content.id, 
        title: content.title,
        poster_url: content.poster_url,
        video_url: content.video_url 
      })
      .from(content)
      .where(eq(content.id, params.id))
      .limit(1);

    if (!existingContent) {
      return NextResponse.json(
        { error: 'ไม่พบเนื้อหา' },
        { status: 404 }
      );
    }

    // Delete files from R2 first
    try {
      const { deleteContentFilesFromR2 } = await import('@/lib/r2-cleanup');
      await deleteContentFilesFromR2(existingContent.id);
    } catch (error) {
      console.error('Error deleting R2 files:', error);
      // Continue with database deletion even if R2 cleanup fails
    }

    // Delete content (cascade will handle related records like episodes)
    await db
      .delete(content)
      .where(eq(content.id, params.id));

    return NextResponse.json({ 
      success: true, 
      message: `ลบเนื้อหา "${existingContent.title}" สำเร็จ` 
    });

  } catch (error) {
    console.error('Delete content error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบเนื้อหา' },
      { status: 500 }
    );
  }
}