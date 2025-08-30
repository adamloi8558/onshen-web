import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    console.log('Creating upload_jobs table...');

    // Create upload_jobs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS upload_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id TEXT NOT NULL UNIQUE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        content_id UUID REFERENCES content(id) ON DELETE CASCADE,
        episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
        file_type TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        upload_url TEXT,
        processed_url TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        progress INTEGER DEFAULT 0 NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create indexes
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS upload_jobs_job_id_idx ON upload_jobs(job_id);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS upload_jobs_user_idx ON upload_jobs(user_id);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS upload_jobs_status_idx ON upload_jobs(status);
    `);

    console.log('Upload jobs table created successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Upload jobs table created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating upload_jobs table:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}