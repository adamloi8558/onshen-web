import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const convertHLSSchema = z.object({
  contentId: z.string().min(1, 'กรุณาระบุ Content ID'),
  mp4Url: z.string().url('URL ไม่ถูกต้อง'),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { contentId, mp4Url } = convertHLSSchema.parse(body);

    console.log('Mock HLS conversion for:', { contentId, mp4Url });

    // Check if content exists
    const [existingContent] = await db
      .select({ id: content.id, title: content.title })
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!existingContent) {
      return NextResponse.json(
        { error: 'ไม่พบเนื้อหา' },
        { status: 404 }
      );
    }

    // Mock HLS conversion process
    // In real implementation, this would:
    // 1. Queue ffmpeg job in BullMQ
    // 2. Convert MP4 to HLS segments
    // 3. Upload HLS files to R2
    // 4. Update database with HLS URL

    // For now, simulate conversion delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock HLS URL (replace .mp4 with .m3u8)
    const hlsUrl = mp4Url.replace('.mp4', '.m3u8').replace('/videos/', '/hls/');
    
    // For now, keep the original MP4 URL since we don't have real HLS files
    // In production, this would update to the actual HLS URL after ffmpeg conversion
    await db
      .update(content)
      .set({
        video_url: mp4Url, // Keep MP4 URL for now
        updated_at: new Date(),
      })
      .where(eq(content.id, contentId));

    console.log('Mock HLS conversion completed:', hlsUrl);

    return NextResponse.json({
      success: true,
      message: 'เตรียมพร้อมสำหรับ HLS แล้ว (ยังคงใช้ MP4 ชั่วคราว)',
      data: {
        contentId,
        title: existingContent.title,
        originalUrl: mp4Url,
        plannedHlsUrl: hlsUrl,
        currentUrl: mp4Url,
        conversionTime: '2 seconds (mock)',
        note: 'ตอนนี้ยังคงใช้ MP4 - ในระบบจริงจะใช้ ffmpeg แปลงเป็น HLS จริง'
      }
    });

  } catch (error) {
    console.error('Mock HLS conversion error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการแปลง HLS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}