import { NextRequest, NextResponse } from 'next/server';
import { db, user_saves, content } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contentId } = paramsSchema.parse(params);

    // Check if already saved
    const [existing] = await db
      .select()
      .from(user_saves)
      .where(and(
        eq(user_saves.user_id, user.id),
        eq(user_saves.content_id, contentId)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json({ 
        error: 'Already bookmarked',
        is_saved: true 
      }, { status: 400 });
    }

    // Add bookmark
    await db.insert(user_saves).values({
      user_id: user.id,
      content_id: contentId,
      created_at: new Date(),
    });

    // Update saves count
    await db
      .update(content)
      .set({
        saves: sql`${content.saves} + 1`,
        updated_at: new Date(),
      })
      .where(eq(content.id, contentId));

    return NextResponse.json({ 
      success: true,
      is_saved: true,
      message: 'บันทึกเรียบร้อย'
    });

  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contentId } = paramsSchema.parse(params);

    // Remove bookmark
    const [deleted] = await db
      .delete(user_saves)
      .where(and(
        eq(user_saves.user_id, user.id),
        eq(user_saves.content_id, contentId)
      ))
      .returning();

    if (!deleted) {
      return NextResponse.json({ 
        error: 'Bookmark not found',
        is_saved: false 
      }, { status: 404 });
    }

    // Update saves count
    await db
      .update(content)
      .set({
        saves: sql`GREATEST(${content.saves} - 1, 0)`,
        updated_at: new Date(),
      })
      .where(eq(content.id, contentId));

    return NextResponse.json({ 
      success: true,
      is_saved: false,
      message: 'ยกเลิกการบันทึกเรียบร้อย'
    });

  } catch (error) {
    console.error('Remove bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get bookmark status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ is_saved: false });
    }

    const { id: contentId } = paramsSchema.parse(params);

    const [existing] = await db
      .select()
      .from(user_saves)
      .where(and(
        eq(user_saves.user_id, user.id),
        eq(user_saves.content_id, contentId)
      ))
      .limit(1);

    return NextResponse.json({ 
      is_saved: !!existing 
    });

  } catch (error) {
    console.error('Get bookmark status error:', error);
    return NextResponse.json({ is_saved: false });
  }
}