import { Metadata } from "next";
import { db, content, categories } from "@/lib/db";
import { eq, and, ilike, or } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

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
      title: `ค้นหา "${query}" - MovieFlix`,
      description: `ผลการค้นหา "${query}" ใน MovieFlix - ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD`,
      openGraph: {
        title: `ค้นหา "${query}" - MovieFlix`,
        description: `ผลการค้นหา "${query}" ใน MovieFlix`,
        images: ["/og-search.jpg"],
      },
    };
  }

  return {
    title: "ค้นหา - MovieFlix",
    description: "ค้นหาหนังและซีรี่ย์ที่คุณต้องการดู",
    openGraph: {
      title: "ค้นหา - MovieFlix",
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  let searchResults: any[] = [];
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
    );

    // Add type filter
    if (typeFilter && (typeFilter === 'movie' || typeFilter === 'series')) {
      whereClause = and(whereClause, eq(content.type, typeFilter));
    }

    // Add category filter
    if (categoryFilter) {
      whereClause = and(whereClause, eq(content.category_id, categoryFilter));
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
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        }
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
              <Badge 
                variant={!typeFilter ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('type');
                  window.location.href = url.toString();
                }}
              >
                ทั้งหมด
              </Badge>
              <Badge 
                variant={typeFilter === 'movie' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('type', 'movie');
                  window.location.href = url.toString();
                }}
              >
                หนัง
              </Badge>
              <Badge 
                variant={typeFilter === 'series' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('type', 'series');
                  window.location.href = url.toString();
                }}
              >
                ซีรี่ย์
              </Badge>
            </div>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {allCategories.map((category) => (
                  <Badge 
                    key={category.id}
                    variant={categoryFilter === category.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      if (categoryFilter === category.id) {
                        url.searchParams.delete('category');
                      } else {
                        url.searchParams.set('category', category.id);
                      }
                      window.location.href = url.toString();
                    }}
                  >
                    {category.name}
                  </Badge>
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
                ผลการค้นหา "{query}"
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