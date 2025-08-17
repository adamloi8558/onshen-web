import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, categories, content } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { Badge } from "@/components/ui/badge";
import { Film, Tv } from "lucide-react";
import Link from "next/link";

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    type?: string;
  };
}

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return {
      title: "หมวดหมู่",
      description: "ดูหนังและซีรี่ย์ตามหมวดหมู่",
    };
  }

  const [category] = await db
    .select({
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.slug, params.slug))
    .limit(1);

  if (!category) {
    return {
      title: "ไม่พบหมวดหมู่",
      description: "ไม่พบหมวดหมู่ที่คุณค้นหา",
    };
  }

  return {
    title: `${category.name} - โรงละคร`,
    description: category.description || `ดูหนังและซีรี่ย์ในหมวดหมู่${category.name}`,
    openGraph: {
      title: `${category.name} - โรงละคร`,
      description: category.description || `ดูหนังและซีรี่ย์ในหมวดหมู่${category.name}`,
      images: ["/og-category.jpg"],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const typeFilter = searchParams.type;

  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">หมวดหมู่</h1>
          <div className="text-center py-16">
            <p className="text-muted-foreground">เนื้อหาในหมวดหมู่นี้</p>
          </div>
        </div>
      </div>
    );
  }

  // Get category info
  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.slug, params.slug))
    .limit(1);

  if (!category) {
    notFound();
  }

  // Build where clause
  let whereClause = and(
    eq(content.status, 'published'),
    eq(content.category_id, category.id)
  )!;

  // Add type filter
  if (typeFilter && (typeFilter === 'movie' || typeFilter === 'series')) {
    whereClause = and(whereClause, eq(content.type, typeFilter))!;
  }

  // Get content in this category
  const categoryContent = await db
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
      created_at: content.created_at,
    })
    .from(content)
    .where(whereClause)
    .orderBy(desc(content.created_at))
    .limit(50);

  // Get counts for filters
  const [totalMovies] = await db
    .select({ count: content.id })
    .from(content)
    .where(and(
      eq(content.status, 'published'),
      eq(content.category_id, category.id),
      eq(content.type, 'movie')
    ));

  const [totalSeries] = await db
    .select({ count: content.id })
    .from(content)
    .where(and(
      eq(content.status, 'published'),
      eq(content.category_id, category.id),
      eq(content.type, 'series')
    ));

  const movieCount = Array.isArray(totalMovies) ? totalMovies.length : (totalMovies ? 1 : 0);
  const seriesCount = Array.isArray(totalSeries) ? totalSeries.length : (totalSeries ? 1 : 0);

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground text-lg mb-6">
              {category.description}
            </p>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Link href={`/categories/${params.slug}`}>
              <Badge variant={!typeFilter ? "default" : "outline"}>
                ทั้งหมด ({movieCount + seriesCount})
              </Badge>
            </Link>
            <Link href={`/categories/${params.slug}?type=movie`}>
              <Badge variant={typeFilter === 'movie' ? "default" : "outline"}>
                <Film className="h-3 w-3 mr-1" />
                หนัง ({movieCount})
              </Badge>
            </Link>
            <Link href={`/categories/${params.slug}?type=series`}>
              <Badge variant={typeFilter === 'series' ? "default" : "outline"}>
                <Tv className="h-3 w-3 mr-1" />
                ซีรี่ย์ ({seriesCount})
              </Badge>
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        {categoryContent.length > 0 ? (
          <div>
            <div className="mb-6">
              <p className="text-muted-foreground">
                พบ {categoryContent.length} รายการ
                {typeFilter && ` ในหมวด${typeFilter === 'movie' ? 'หนัง' : 'ซีรี่ย์'}`}
              </p>
            </div>
            <ContentGrid content={categoryContent} showType={!typeFilter} />
          </div>
        ) : (
          <div className="text-center py-12">
            {typeFilter === 'movie' ? (
              <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            ) : typeFilter === 'series' ? (
              <Tv className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            ) : (
              <Badge className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            )}
            <h3 className="text-xl font-bold mb-2">
              ยังไม่มี{typeFilter === 'movie' ? 'หนัง' : typeFilter === 'series' ? 'ซีรี่ย์' : 'เนื้อหา'}ในหมวดนี้
            </h3>
            <p className="text-muted-foreground">
              เนื้อหาในหมวด{category.name}จะแสดงขึ้นเมื่อมีการเพิ่ม
            </p>
          </div>
        )}
      </div>
    </div>
  );
}