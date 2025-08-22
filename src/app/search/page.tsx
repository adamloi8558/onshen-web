import { Metadata } from "next";
import { db, content, categories } from "@/lib/db";
import { eq, and, ilike, or } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
    category?: string;
  };
}

// Force dynamic rendering for real-time search
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q;
  
  if (query) {
    return {
      title: `ค้นหา "${query}" - Ronglakorn`,
      description: `ผลการค้นหา "${query}" ใน Ronglakorn - ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD`,
      openGraph: {
        title: `ค้นหา "${query}" - Ronglakorn`,
        description: `ผลการค้นหา "${query}" ใน Ronglakorn`,
        images: ["/og-search.jpg"],
      },
    };
  }

  return {
    title: "ค้นหา - Ronglakorn",
    description: "ค้นหาหนังและซีรี่ย์ที่คุณต้องการดู",
    openGraph: {
      title: "ค้นหา - Ronglakorn",
      description: "ค้นหาหนังและซีรี่ย์ที่คุณต้องการดู",
      images: ["/og-search.jpg"],
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim();
  const typeFilter = searchParams.type;
  const categoryFilter = searchParams.category;

  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">ค้นหา</h1>
          <div className="text-center py-16">
            <p className="text-muted-foreground">ค้นหาหนังและซีรี่ย์ที่คุณต้องการ</p>
          </div>
        </div>
      </div>
    );
  }

  let searchResults: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    type: 'movie' | 'series';
    poster_url: string | null;
    content_rating: string | null;
    is_vip_required: boolean;
    views: number;
    saves: number;
    total_episodes: number | null;
    category: { id: string; name: string; slug: string; } | null;
    created_at: Date;
  }> = [];
  let totalResults = 0;

  if (query && query.length > 0) {
    // Build search conditions
    const searchConditions = [
      ilike(content.title, `%${query}%`),
      ilike(content.description, `%${query}%`),
    ];

    let whereClause = and(
      eq(content.status, 'published'),
      or(...searchConditions)
    )!;

    // Add type filter
    if (typeFilter && (typeFilter === 'movie' || typeFilter === 'series')) {
      whereClause = and(whereClause, eq(content.type, typeFilter))!;
    }

    // Add category filter
    if (categoryFilter) {
      whereClause = and(whereClause, eq(content.category_id, categoryFilter))!;
    }

    searchResults = await db
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
      .limit(50);

    totalResults = searchResults.length;
  }

  // Get all categories for filter
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(categories.name);

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">ค้นหา</h1>
          
          {/* Search Form */}
          <form method="GET" className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                name="q"
                type="search"
                placeholder="ค้นหาหนัง ซีรี่ย์..."
                defaultValue={query}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              ค้นหา
            </Button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <div className="flex gap-2">
              <Link href={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}>
                <Badge variant={!typeFilter ? "default" : "outline"}>
                  ทั้งหมด
                </Badge>
              </Link>
              <Link href={`/search?${new URLSearchParams({ ...(query && { q: query }), type: 'movie' }).toString()}`}>
                <Badge variant={typeFilter === 'movie' ? "default" : "outline"}>
                  หนัง
                </Badge>
              </Link>
              <Link href={`/search?${new URLSearchParams({ ...(query && { q: query }), type: 'series' }).toString()}`}>
                <Badge variant={typeFilter === 'series' ? "default" : "outline"}>
                  ซีรี่ย์
                </Badge>
              </Link>
            </div>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {allCategories.map((category) => (
                  <Link 
                    key={category.id}
                    href={`/search?${new URLSearchParams({ 
                      ...(query && { q: query }), 
                      ...(typeFilter && { type: typeFilter }),
                      ...(categoryFilter === category.id ? {} : { category: category.id })
                    }).toString()}`}
                  >
                    <Badge variant={categoryFilter === category.id ? "default" : "outline"}>
                      {category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {query ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                ผลการค้นหา &ldquo;{query}&rdquo;
              </h2>
              <p className="text-muted-foreground">
                พบ {totalResults} รายการ
              </p>
            </div>

            {searchResults.length > 0 ? (
              <ContentGrid content={searchResults} showType={true} />
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">ไม่พบผลการค้นหา</h3>
                <p className="text-muted-foreground">
                  ลองค้นหาด้วยคำอื่น หรือตรวจสอบการสะกดคำ
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">ค้นหาเนื้อหาที่คุณต้องการ</h3>
            <p className="text-muted-foreground">
              ใส่ชื่อหนัง ซีรี่ย์ หรือคำที่เกี่ยวข้องในช่องค้นหาด้านบน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}