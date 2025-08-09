import { db, users, categories, content } from './index';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create admin user
    const adminPassword = await hashPassword('admin123456');
    
    await db.insert(users).values({
      phone: '0800000000',
      password_hash: adminPassword,
      avatar_url: '/avatars/default.webp',
      role: 'admin',
      coins: 1000,
      balance: '100.00',
      is_vip: true,
      vip_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Admin user created');

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

    for (const category of categoryData) {
      await db.insert(categories).values({
        name: category.name,
        slug: category.slug,
        description: `หมวดหมู่${category.name}`,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    console.log('✅ Categories created');

    // Create sample content
    const [actionCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'action'))
      .limit(1);

    if (actionCategory) {
      await db.insert(content).values({
        title: 'ตัวอย่างหนังบู๊',
        slug: 'sample-action-movie',
        description: 'นี่คือหนังบู๊ตัวอย่างสำหรับทดสอบระบบ',
        type: 'movie',
        status: 'published',
        content_rating: 'PG-13',
        poster_url: '/posters/sample.jpg',
        backdrop_url: '/backdrops/sample.jpg',
        release_date: new Date(),
        duration_minutes: 120,
        views: 1000,
        saves: 50,
        is_vip_required: false,
        category_id: actionCategory.id,
        search_vector: 'ตัวอย่าง หนัง บู๊ action sample',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    console.log('✅ Sample content created');
    console.log('🎉 Database seed completed successfully!');

  } catch (error) {
    console.error('❌ Database seed failed:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🏁 Seed finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

export { seed };