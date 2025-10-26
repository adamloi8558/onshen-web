import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const youtubeInfoSchema = z.object({
  url: z.string().url('URL ไม่ถูกต้อง'),
});

// Extract YouTube video ID from URL
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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { url } = youtubeInfoSchema.parse(body);

    console.log('YouTube info request:', { url });

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'URL YouTube ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    console.log('Extracted video ID:', videoId);

    // Use yt-dlp API to get video info
    // Note: We'll use a serverless function or external service
    // For now, we'll use youtube-dl-exec or ytdl-core
    
    try {
      // Call external API or use ytdl-core
      // For production, recommend using yt-dlp via API
      const infoUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      
      const response = await fetch(infoUrl);
      
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลวิดีโอได้');
      }

      const data = await response.json();
      
      // For more detailed info, we need yt-dlp
      // This is basic info from oEmbed
      return NextResponse.json({
        success: true,
        videoId,
        title: data.title || 'Untitled',
        description: `ดาวน์โหลดจาก YouTube: ${url}`,
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author: data.author_name || 'Unknown',
        url: url,
        message: 'ดึงข้อมูลสำเร็จ พร้อมดาวน์โหลด',
      });

    } catch (error) {
      console.error('YouTube info error:', error);
      return NextResponse.json(
        { 
          error: 'ไม่สามารถดึงข้อมูลวิดีโอได้',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('YouTube info error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาด',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
