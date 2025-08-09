import { Metadata } from "next";
import { db, content, categories } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PopularPageProps {
  searchParams: {
    type?: string;
  };
}

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "ยอดนิยม - MovieFlix",
  description: "หนังและซีรี่ย์ยอดนิยมที่คนดูมากที่สุด",
  openGraph: {
    title: "ยอดนิยม - MovieFlix",
    description: "หนังและซีรี่ย์ยอดนิยมที่คนดูมากที่สุด",
    images: ["/og-popular.jpg"],
  },
};

export default async function PopularPage({ searchParams }: PopularPageProps) {
  const typeFilter = searchParams.type;

  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">ยอดนิยม</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Build where clause
  let whereClause = eq(content.status, 'published');

  // Add type filter
  if (typeFilter && (typeFilter === 'movie' || typeFilter === 'series')) {
    whereClause = and(whereClause, eq(content.type, typeFilter));
  }

  // Get popular content (sorted by views)
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
      },
      created_at: content.created_at,
    })
    .from(content)
    .leftJoin(categories, eq(content.category_id, categories.id))
    .where(whereClause)
    .orderBy(desc(content.views))
    .limit(50);

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">ยอดนิยม</h1>
          <p className="text-muted-foreground text-lg mb-6">
            หนังและซีรี่ย์ที่คนดูมากที่สุดในขณะนี้
          </p>

          {/* Type Filters */}
          <div className="flex gap-2">
            <Link href="/popular">
              <Badge variant={!typeFilter ? "default" : "outline"}>
                ทั้งหมด
              </Badge>
            </Link>
            <Link href="/popular?type=movie">
              <Badge variant={typeFilter === 'movie' ? "default" : "outline"}>
                หนัง
              </Badge>
            </Link>
            <Link href="/popular?type=series">
              <Badge variant={typeFilter === 'series' ? "default" : "outline"}>
                ซีรี่ย์
              </Badge>
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        {popularContent.length > 0 ? (
          <div>
            <div className="mb-6">
              <p className="text-muted-foreground">
                แสดง {popularContent.length} เรื่อง
                {typeFilter && ` ในหมวด${typeFilter === 'movie' ? 'หนัง' : 'ซีรี่ย์'}`}
                เรียงตามจำนวนผู้ชม
              </p>
            </div>
            <ContentGrid content={popularContent} showType={!typeFilter} />
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">ยังไม่มีเนื้อหายอดนิยม</h3>
            <p className="text-muted-foreground">
              เนื้อหาจะแสดงขึ้นเมื่อมีการดูและให้คะแนน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}