import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Migrating content table...');

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Create enum types if they don't exist
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE content_type AS ENUM ('movie', 'series');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE content_rating AS ENUM ('G', 'PG', 'PG-13', 'R', 'NC-17');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add missing columns to content table
    await db.execute(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS poster_url TEXT,
      ADD COLUMN IF NOT EXISTS backdrop_url TEXT,
      ADD COLUMN IF NOT EXISTS trailer_url TEXT,
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS release_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
      ADD COLUMN IF NOT EXISTS total_episodes INTEGER,
      ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS search_vector TEXT,
      ADD COLUMN IF NOT EXISTS is_vip_required BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS category_id UUID;
    `);

    // Set default values and constraints if columns were just created
    await db.execute(`
      UPDATE content SET 
        views = COALESCE(views, 0),
        saves = COALESCE(saves, 0),
        is_vip_required = COALESCE(is_vip_required, false)
      WHERE views IS NULL OR saves IS NULL OR is_vip_required IS NULL;
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