import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { addYoutubeDownloadJob, YoutubeDownloadJobData } from '@/lib/queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const youtubeDownloadSchema = z.object({
  url: z.string().url('URL ไม่ถูกต้อง'),
  title: z.string().min(1, 'กรุณาระบุชื่อ'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['movie', 'series']).default('movie'),
  cookies: z.string().optional(),
});

// Extract YouTube video ID
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now();
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();

    const body = await req.json();
    const validatedData = youtubeDownloadSchema.parse(body);

    console.log('YouTube download request:', validatedData);

    // Extract video ID
    const videoId = extractVideoId(validatedData.url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'URL YouTube ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = generateSlug(validatedData.title);
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Create content as draft
    const contentId = uuidv4();
    
    await db.insert(content).values({
      id: contentId,
      title: validatedData.title,
      slug: slug,
      description: validatedData.description || `ดาวน์โหลดจาก YouTube: ${validatedData.url}`,
      type: validatedData.type,
      status: 'draft', // ตั้งเป็นร่างไว้ให้ admin ตรวจสอบ
      poster_url: thumbnailUrl,
      backdrop_url: thumbnailUrl,
      category_id: validatedData.categoryId || null,
      is_vip_required: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('Content created as draft:', {
      contentId,
      slug,
      title: validatedData.title,
    });

    // Create download job (will be processed by worker)
    const jobId = uuidv4();
    
    const downloadJobData: YoutubeDownloadJobData = {
      jobId,
      userId: user.id,
      contentId,
      youtubeUrl: validatedData.url,
      videoId,
      title: validatedData.title,
      cookies: validatedData.cookies,
    };

    console.log('Creating YouTube download job:', downloadJobData);

    // Add to BullMQ queue
    try {
      const queueJobId = await addYoutubeDownloadJob(downloadJobData);
      console.log('YouTube download job queued:', { queueJobId });
    } catch (queueError) {
      console.error('Failed to queue YouTube download:', queueError);
      throw new Error('ไม่สามารถเริ่มดาวน์โหลดได้');
    }

    return NextResponse.json({
      success: true,
      contentId,
      jobId,
      slug,
      message: 'สร้างเนื้อหาเป็นร่างแล้ว กำลังเริ่มดาวน์โหลดจาก YouTube...',
      note: 'ดาวน์โหลดและแปลง HLS จะใช้เวลาประมาณ 5-15 นาที',
    });

  } catch (error) {
    console.error('YouTube download error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดาวน์โหลด',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
