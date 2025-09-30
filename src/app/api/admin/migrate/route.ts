import { NextResponse } from 'next/server';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL is not set' },
        { status: 500 }
      );
    }

    const start = Date.now();
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: 'drizzle' });
    await sql.end({ timeout: 5 });
    const ms = Date.now() - start;
    return NextResponse.json({ success: true, elapsedMs: ms });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


