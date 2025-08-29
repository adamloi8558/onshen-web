import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { upload_jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireAuth();

    const [job] = await db
      .select({
        id: upload_jobs.id,
        job_id: upload_jobs.job_id,
        status: upload_jobs.status,
        progress: upload_jobs.progress,
        processed_url: upload_jobs.processed_url,
        error_message: upload_jobs.error_message,
        created_at: upload_jobs.created_at,
        updated_at: upload_jobs.updated_at,
      })
      .from(upload_jobs)
      .where(eq(upload_jobs.job_id, params.jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'ไม่พบงานอัปโหลด' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.job_id,
        status: job.status,
        progress: job.progress,
        processed_url: job.processed_url,
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
      }
    });

  } catch (error) {
    console.error('Get upload status error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ' },
      { status: 500 }
    );
  }
}