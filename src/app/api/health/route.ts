import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Simple database health check
    await db.execute('SELECT 1');
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'xxx-web'
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
        service: 'xxx-web'
      },
      { status: 503 }
    );
  }
}