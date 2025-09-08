import { db, content, categories } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { TrendingUp, Star, Clock } from "lucide-react";

async function getRecommendedContent() {
  try {
    // Get popular content (most views)
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

    // Get most saved content
    const savedContent = await db
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
      .orderBy(desc(content.saves))
      .limit(12);

    // Get latest content
    const latestContent = await db
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
      .orderBy(desc(content.created_at))
      .limit(12);

    return {
      popular: popularContent,
      saved: savedContent,
      latest: latestContent,
    };
  } catch (error) {
    console.error('Error fetching recommended content:', error);
    return {
      popular: [],
      saved: [],
      latest: [],
    };
  }
}

export default async function RecommendedContent() {
  const { popular, saved, latest } = await getRecommendedContent();

  return (
    <div className="space-y-12">
      {/* Popular Content */}
      {popular.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h2 className="text-2xl font-bold">ยอดนิยม</h2>
            <span className="text-muted-foreground">เนื้อหาที่มียอดชมสูงสุด</span>
          </div>
          <ContentGrid content={popular} showType={true} />
        </section>
      )}

      {/* Most Saved Content */}
      {saved.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-2xl font-bold">บันทึกมากที่สุด</h2>
            <span className="text-muted-foreground">เนื้อหาที่ผู้ใช้บันทึกมากที่สุด</span>
          </div>
          <ContentGrid content={saved} showType={true} />
        </section>
      )}

      {/* Latest Content */}
      {latest.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-bold">เพิ่มใหม่ล่าสุด</h2>
            <span className="text-muted-foreground">เนื้อหาที่เพิ่งอัปโหลด</span>
          </div>
          <ContentGrid content={latest} showType={true} />
        </section>
      )}

      {/* Empty State */}
      {popular.length === 0 && saved.length === 0 && latest.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            ยังไม่มีเนื้อหาแนะนำ
          </p>
        </div>
      )}
    </div>
  );
}