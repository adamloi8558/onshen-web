import { NextRequest, NextResponse } from 'next/server';
import { db, content } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { deleteFileFromR2 } from '@/lib/r2-cleanup';

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
        poster_url: content.poster_url 
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

    // Delete poster file from R2
    if (existingContent.poster_url) {
      try {
        await deleteFileFromR2(existingContent.poster_url);
      } catch (error) {
        console.error('Error deleting poster from R2:', error);
        // Continue with database update even if R2 cleanup fails
      }
    }

    // Remove poster_url from database
    await db
      .update(content)
      .set({
        poster_url: null,
        updated_at: new Date(),
      })
      .where(eq(content.id, params.id));

    return NextResponse.json({ 
      success: true, 
      message: `ลบโปสเตอร์ของ "${existingContent.title}" สำเร็จ` 
    });

  } catch (error) {
    console.error('Delete poster error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบโปสเตอร์' },
      { status: 500 }
    );
  }
}