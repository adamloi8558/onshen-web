import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    turnstile_site_key: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 'not set',
    app_url: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    api_url: process.env.NEXT_PUBLIC_API_URL || 'not set',
    node_env: process.env.NODE_ENV || 'not set',
    timestamp: new Date().toISOString()
  });
}