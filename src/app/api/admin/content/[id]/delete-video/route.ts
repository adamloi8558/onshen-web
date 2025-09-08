import { NextRequest, NextResponse } from 'next/server';
import { db, content } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { deleteVideoFromR2 } from '@/lib/r2-cleanup';

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

    // Delete video files from R2
    try {
      await deleteVideoFromR2(existingContent.id);
    } catch (error) {
      console.error('Error deleting video from R2:', error);
      // Continue with database update even if R2 cleanup fails
    }

    // Remove video_url from database
    await db
      .update(content)
      .set({
        video_url: null,
        updated_at: new Date(),
      })
      .where(eq(content.id, params.id));

    return NextResponse.json({ 
      success: true, 
      message: `ลบวิดีโอของ "${existingContent.title}" สำเร็จ` 
    });

  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบวิดีโอ' },
      { status: 500 }
    );
  }
}