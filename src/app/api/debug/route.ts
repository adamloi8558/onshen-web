import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== Debug API Started ===');
    
    // Test environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      hasDbUrl: process.env.DATABASE_URL?.substring(0, 20) + '...'
    };
    console.log('Environment check:', envCheck);
    
    // Test database connection
    let dbStatus = 'Failed';
    try {
      if (db) {
        dbStatus = 'Connected';
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      dbStatus = `Error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`;
    }
    
    // Test auth
    let authStatus = 'No auth';
    try {
      const user = await getCurrentUser();
      authStatus = user ? `User: ${user.phone}` : 'Not authenticated';
    } catch (authError) {
      console.error('Auth error:', authError);
      authStatus = `Auth error: ${authError instanceof Error ? authError.message : 'Unknown'}`;
    }
    
    console.log('=== Debug API Completed ===');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      authentication: authStatus,
      message: 'Debug check completed'
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}