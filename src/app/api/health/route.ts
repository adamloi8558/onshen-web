import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic application health check - don't test database during healthcheck
    // as environment variables might not be available at runtime
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'xxx-web',
      uptime: process.uptime()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Application health check failed',
        timestamp: new Date().toISOString(),
        service: 'xxx-web'
      },
      { status: 503 }
    );
  }
}