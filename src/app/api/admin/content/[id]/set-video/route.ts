import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const setVideoSchema = z.object({
  video_url: z.string().url('URL ไม่ถูกต้อง'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { video_url } = setVideoSchema.parse(body);

    console.log('Setting video URL for content:', params.id, 'URL:', video_url);

    // Check if content exists
    const [existingContent] = await db
      .select({ id: content.id, title: content.title })
      .from(content)
      .where(eq(content.id, params.id))
      .limit(1);

    if (!existingContent) {
      return NextResponse.json(
        { error: 'ไม่พบเนื้อหา' },
        { status: 404 }
      );
    }

    // Update video URL
    await db
      .update(content)
      .set({
        video_url: video_url,
        updated_at: new Date(),
      })
      .where(eq(content.id, params.id));

    console.log('Video URL updated successfully');

    return NextResponse.json({
      success: true,
      message: 'อัพเดต URL วิดีโอสำเร็จ',
      data: {
        contentId: params.id,
        title: existingContent.title,
        video_url: video_url
      }
    });

  } catch (error) {
    console.error('Set video URL error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'URL ไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการอัพเดต URL วิดีโอ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}