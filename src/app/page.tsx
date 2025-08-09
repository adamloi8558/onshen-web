import { Metadata } from "next";
import { db, content, categories } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import Hero from "@/components/hero";
import { getCurrentUser } from "@/lib/auth";

// Force dynamic rendering because we use cookies()
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "หน้าแรก",
  description: "ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่ สมาชิก VIP เพียง 39 บาทต่อเดือน",
  openGraph: {
    title: "MovieFlix - ดูหนังออนไลน์ คุณภาพ HD",
    description: "ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่ สมาชิก VIP เพียง 39 บาทต่อเดือน",
    images: ["/og-home.jpg"],
  },
};

export default async function HomePage() {
  try {
    const user = await getCurrentUser();

    // Skip database queries during build with placeholder database
    if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
      return (
        <div className="min-h-screen">
          <div className="container py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">MovieFlix</h1>
              <p className="text-muted-foreground">ดูหนังและซีรี่ย์ออนไลน์คุณภาพสูง</p>
            </div>
          </div>
        </div>
      );
    }

    // Get featured content for hero
    const [featuredContent] = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      backdrop_url: content.backdrop_url,
      video_url: content.video_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
    })
    .from(content)
    .where(and(
      eq(content.status, 'published'),
      eq(content.type, 'movie')
    ))
    .orderBy(desc(content.views))
    .limit(1);

  // Get latest movies
  const latestMovies = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      }
    })
    .from(content)
    .leftJoin(categories, eq(content.category_id, categories.id))
    .where(and(
      eq(content.status, 'published'),
      eq(content.type, 'movie')
    ))
    .orderBy(desc(content.created_at))
    .limit(12);

  // Get latest series
  const latestSeries = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
      total_episodes: content.total_episodes,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      }
    })
    .from(content)
    .leftJoin(categories, eq(content.category_id, categories.id))
    .where(and(
      eq(content.status, 'published'),
      eq(content.type, 'series')
    ))
    .orderBy(desc(content.created_at))
    .limit(12);

  // Get most viewed content
  const popularContent = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
      total_episodes: content.total_episodes,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      }
    })
    .from(content)
    .leftJoin(categories, eq(content.category_id, categories.id))
    .where(eq(content.status, 'published'))
    .orderBy(desc(content.views))
    .limit(12);

  return (
    <div className="min-h-screen">
      {featuredContent && (
        <Hero content={featuredContent} user={user} />
      )}
      
      <div className="container space-y-12 py-12">
        {/* Latest Movies */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">หนังใหม่ล่าสุด</h2>
            <a 
              href="/movies" 
              className="text-primary hover:underline font-medium"
            >
              ดูทั้งหมด
            </a>
          </div>
          <ContentGrid 
            content={latestMovies} 
            showType={false}
          />
        </section>

        {/* Latest Series */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">ซีรี่ย์ใหม่ล่าสุด</h2>
            <a 
              href="/series" 
              className="text-primary hover:underline font-medium"
            >
              ดูทั้งหมด
            </a>
          </div>
          <ContentGrid 
            content={latestSeries} 
            showType={false}
          />
        </section>

        {/* Popular Content */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">ยอดนิยม</h2>
            <a 
              href="/popular" 
              className="text-primary hover:underline font-medium"
            >
              ดูทั้งหมด
            </a>
          </div>
          <ContentGrid 
            content={popularContent} 
            showType={true}
          />
        </section>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Homepage error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">MovieFlix</h1>
          <p className="text-muted-foreground mb-4">
            ระบบกำลังเตรียมพร้อม กรุณารอสักครู่...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }
}