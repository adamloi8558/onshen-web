import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('=== DEBUG INFO ===');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DB instance exists:', !!db);
    
    // Test database connection if db exists
    if (db && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      console.log('Testing database connection...');
      
      // Simple query to test connection
      const result = await db.execute('SELECT 1 as test');
      console.log('Database test successful:', result);
      
      return NextResponse.json({
        status: 'success',
        database: 'connected',
        env: process.env.NODE_ENV,
        hasDb: !!db,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'info', 
        database: 'placeholder or not available',
        env: process.env.NODE_ENV,
        hasDb: !!db,
        dbUrl: process.env.DATABASE_URL?.includes('placeholder') ? 'placeholder' : 'real',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      env: process.env.NODE_ENV,
      hasDb: !!db,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}