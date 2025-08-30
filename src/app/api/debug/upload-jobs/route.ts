import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { upload_jobs } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    console.log('Testing upload_jobs table...');

    // Test if table exists and get structure
    const testQuery = await db.select().from(upload_jobs).limit(1);
    console.log('Upload jobs table accessible, sample:', testQuery);

    // Get all upload jobs
    const allJobs = await db.select().from(upload_jobs).limit(10);
    
    return NextResponse.json({
      success: true,
      message: 'Upload jobs table test successful',
      data: {
        tableExists: true,
        totalJobs: allJobs.length,
        sampleJobs: allJobs,
        schema: {
          id: 'uuid',
          job_id: 'text',
          user_id: 'uuid',
          content_id: 'uuid (nullable)',
          episode_id: 'uuid (nullable)',
          file_type: 'text',
          original_filename: 'text',
          file_size: 'integer',
          upload_url: 'text (nullable)',
          processed_url: 'text (nullable)',
          status: 'text',
          progress: 'integer',
          error_message: 'text (nullable)',
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      }
    });

  } catch (error) {
    console.error('Upload jobs test error:', error);
    return NextResponse.json(
      { 
        error: 'Upload jobs table test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}