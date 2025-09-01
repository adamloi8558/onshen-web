import { NextRequest, NextResponse } from 'next/server';
import { db, content, episodes } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  type: z.enum(['content', 'episode']).optional().default('content'),
  episode_id: z.string().uuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: contentId } = paramsSchema.parse(params);
    const body = await request.json();
    const { type, episode_id } = bodySchema.parse(body);

    if (type === 'episode' && episode_id) {
      // Increment episode views
      await db
        .update(episodes)
        .set({
          views: sql`${episodes.views} + 1`,
          updated_at: new Date(),
        })
        .where(eq(episodes.id, episode_id));
    } else {
      // Increment content views
      await db
        .update(content)
        .set({
          views: sql`${content.views} + 1`,
          updated_at: new Date(),
        })
        .where(eq(content.id, contentId));
    }

    return NextResponse.json({ 
      success: true,
      message: 'View counted'
    });

  } catch (error) {
    console.error('View count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}