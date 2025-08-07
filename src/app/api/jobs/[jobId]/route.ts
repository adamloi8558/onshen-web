import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db, upload_jobs } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Authentication check
    const user = await requireAuth();
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get upload job
    const [uploadJob] = await db
      .select({
        id: upload_jobs.id,
        job_id: upload_jobs.job_id,
        user_id: upload_jobs.user_id,
        file_type: upload_jobs.file_type,
        original_filename: upload_jobs.original_filename,
        file_size: upload_jobs.file_size,
        upload_url: upload_jobs.upload_url,
        processed_url: upload_jobs.processed_url,
        status: upload_jobs.status,
        progress: upload_jobs.progress,
        error_message: upload_jobs.error_message,
        created_at: upload_jobs.created_at,
        updated_at: upload_jobs.updated_at,
      })
      .from(upload_jobs)
      .where(eq(upload_jobs.job_id, jobId))
      .limit(1);

    if (!uploadJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (uploadJob.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      job: uploadJob,
    });

  } catch (error) {
    console.error('Get job status error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}