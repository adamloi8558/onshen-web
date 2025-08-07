import { Metadata } from "next";
import { db, content, categories } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";

// Force dynamic rendering to prevent static optimization
export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: "ซีรี่ย์",
  description: "ดูซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่",
  openGraph: {
    title: "ซีรี่ย์ - MovieFlix",
    description: "ดูซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่",
    images: ["/og-series.jpg"],
  },
};

export default async function SeriesPage() {
  try {
    // Skip database queries during build with placeholder database
    if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
      return (
        <div className="min-h-screen">
          <div className="container py-12">
            <h1 className="text-4xl font-bold mb-8">ซีรี่ย์</h1>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    // Get all published series
    const series = await db
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
    .limit(50);

  return (
    <div className="min-h-screen">
      <div className="container space-y-8 py-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">ซีรี่ย์</h1>
          <p className="text-muted-foreground text-lg">
            ดูซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่
          </p>
        </div>

        {/* Series Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">ซีรี่ย์ทั้งหมด</h2>
            <p className="text-muted-foreground">
              {series.length} เรื่อง
            </p>
          </div>
          
          {series.length > 0 ? (
            <ContentGrid 
              content={series} 
              showType={false}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                ยังไม่มีซีรี่ย์ในระบบ
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Series page error:', error);
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">ซีรี่ย์</h1>
          <p className="text-muted-foreground">
            ระบบกำลังเตรียมพร้อม กรุณารอสักครู่...
          </p>
        </div>
      </div>
    );
  }
}