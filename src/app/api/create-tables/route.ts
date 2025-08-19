import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Creating database tables...');
    
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Create users table first
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        avatar_url TEXT DEFAULT '/avatars/default.webp',
        role TEXT DEFAULT 'user' NOT NULL,
        coins INTEGER DEFAULT 0 NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        is_vip BOOLEAN DEFAULT false NOT NULL,
        vip_expires_at TIMESTAMP,
        last_login_at TIMESTAMP,
        reset_otp TEXT,
        reset_otp_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create content table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        poster_url TEXT,
        type TEXT DEFAULT 'movie' NOT NULL,
        status TEXT DEFAULT 'published' NOT NULL,
        content_rating TEXT,
        views INTEGER DEFAULT 0 NOT NULL,
        saves INTEGER DEFAULT 0 NOT NULL,
        total_episodes INTEGER DEFAULT 1,
        category_id UUID REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create episodes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS episodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        episode_number TEXT NOT NULL,
        title TEXT,
        description TEXT,
        video_url TEXT,
        duration INTEGER,
        is_premium BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(content_id, episode_number)
      );
    `);

    // Create user_saves table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_saves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, content_id)
      );
    `);

    console.log('✅ All tables created successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'All tables created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}