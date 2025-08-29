import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { content, categories } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    // Test database connection
    console.log('Testing database connection...');

    // Test categories table
    const categoriesCount = await db.select().from(categories);
    console.log('Categories found:', categoriesCount.length);

    // Test content table
    const contentCount = await db.select().from(content);
    console.log('Content found:', contentCount.length);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        categories: categoriesCount.length,
        content: contentCount.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}