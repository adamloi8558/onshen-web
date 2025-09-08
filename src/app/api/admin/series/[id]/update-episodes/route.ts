import { NextRequest, NextResponse } from 'next/server';
import { db, content, episodes } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { eq, count } from 'drizzle-orm';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    const { id: seriesId } = paramsSchema.parse(params);

    // Count episodes for this series
    const [episodeCount] = await db
      .select({ count: count() })
      .from(episodes)
      .where(eq(episodes.content_id, seriesId));

    // Update total_episodes in content table
    await db
      .update(content)
      .set({
        total_episodes: episodeCount?.count || 0,
        updated_at: new Date(),
      })
      .where(eq(content.id, seriesId));

    return NextResponse.json({ 
      success: true,
      total_episodes: episodeCount?.count || 0,
      message: 'อัปเดตจำนวนตอนเรียบร้อย'
    });

  } catch (error) {
    console.error('Update episodes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}