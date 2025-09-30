import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const start = Date.now();
    // simple connectivity check
    const ping = await db.execute(sql`select 1 as ok`);
    const ms = Date.now() - start;
    return NextResponse.json({ success: true, ping, elapsedMs: ms });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


