import { NextResponse } from 'next/server';
import { db, categories } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🌱 Creating categories...');

    // Create sample categories
    const categoryData = [
      { name: 'บู๊', slug: 'action' },
      { name: 'ตลก', slug: 'comedy' },
      { name: 'หลอน', slug: 'horror' },
      { name: 'โรแมนติก', slug: 'romance' },
      { name: 'ไซไฟ', slug: 'sci-fi' },
      { name: 'ระทึกขวัญ', slug: 'thriller' },
      { name: 'ผจญภัย', slug: 'adventure' },
      { name: 'ดราม่า', slug: 'drama' },
    ];

    const createdCategories = [];

    for (const category of categoryData) {
      // Check if category already exists
      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug))
        .limit(1);

      if (!existing) {
        const [newCategory] = await db.insert(categories).values({
          name: category.name,
          slug: category.slug,
          description: `หมวดหมู่${category.name}`,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning();

        createdCategories.push(newCategory);
      }
    }

    console.log(`✅ Categories created: ${createdCategories.length} new categories`);
    
    return NextResponse.json({ 
      success: true,
      message: `Categories created successfully: ${createdCategories.length} new categories`,
      created: createdCategories.length,
      timestamp: new Date().toISOString() 
    });

  } catch (error: unknown) {
    console.error('Error creating categories:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}