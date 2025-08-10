import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Migrating content table...');

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Add missing columns to content table
    await db.execute(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS poster_url TEXT,
      ADD COLUMN IF NOT EXISTS backdrop_url TEXT,
      ADD COLUMN IF NOT EXISTS trailer_url TEXT,
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS release_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
      ADD COLUMN IF NOT EXISTS search_vector TEXT;
    `);

    console.log('Content table migration completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Content table migration completed successfully',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('Error migrating content table:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}