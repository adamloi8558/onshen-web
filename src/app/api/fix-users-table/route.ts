import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Adding missing columns to users table...');

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Add missing columns to users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp TEXT,
      ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP;
    `);

    console.log('Users table updated successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Users table updated successfully',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('Error updating users table:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}