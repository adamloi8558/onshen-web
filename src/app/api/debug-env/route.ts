import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    allEnvKeys: Object.keys(process.env)
      .filter(key => key.includes('TURNSTILE') || key.includes('NEXT_PUBLIC'))
      .sort(),
    timestamp: new Date().toISOString()
  });
}