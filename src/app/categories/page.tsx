import { Metadata } from "next";
import Link from "next/link";
import { db, categories, content } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Tv } from "lucide-react";

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "หมวดหมู่ - โรงละคร",
  description: "เลือกดูหนังและซีรี่ย์ตามหมวดหมู่ที่คุณชื่นชอบ",
  openGraph: {
    title: "หมวดหมู่ - โรงละคร",
    description: "เลือกดูหนังและซีรี่ย์ตามหมวดหมู่ที่คุณชื่นชอบ",
    images: ["/og-categories.jpg"],
  },
};

export default async function CategoriesPage() {
  try {
    console.log('Categories page: Starting...');

    // Skip database queries during build with placeholder database
    if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
      return (
        <div className="min-h-screen">
          <div className="container py-12">
            <h1 className="text-4xl font-bold mb-8">หมวดหมู่</h1>
            <div className="text-center py-16">
              <p className="text-muted-foreground">เลือกดูตามหมวดหมู่ที่คุณสนใจ</p>
            </div>
          </div>
        </div>
      );
    }

    console.log('Categories page: About to execute database query');

  // Get all categories with content count
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      total_content: count(content.id),
    })
    .from(categories)
    .leftJoin(content, eq(categories.id, content.category_id))
    .groupBy(categories.id, categories.name, categories.slug, categories.description)
    .orderBy(categories.name);

  // Get content count by type for each category
  const categoriesWithCounts = await Promise.all(
    allCategories.map(async (category) => {
      const [movieCount] = await db
        .select({ count: count(content.id) })
        .from(content)
        .where(eq(content.category_id, category.id) && eq(content.type, 'movie'));

      const [seriesCount] = await db
        .select({ count: count(content.id) })
        .from(content)
        .where(eq(content.category_id, category.id) && eq(content.type, 'series'));

      return {
        ...category,
        movie_count: movieCount?.count || 0,
        series_count: seriesCount?.count || 0,
      };
    })
  );

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">หมวดหมู่</h1>
          <p className="text-muted-foreground text-lg">
            เลือกดูหนังและซีรี่ย์ตามหมวดหมู่ที่คุณชื่นชอบ
          </p>
        </div>

        {/* Categories Grid */}
        {categoriesWithCounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesWithCounts.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="block group"
              >
                <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <Badge variant="secondary">
                        {category.total_content} เรื่อง
                      </Badge>
                    </div>
                    
                    {category.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Film className="h-4 w-4" />
                        <span>{category.movie_count} หนัง</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tv className="h-4 w-4" />
                        <span>{category.series_count} ซีรี่ย์</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">ยังไม่มีหมวดหมู่</h3>
            <p className="text-muted-foreground">
              หมวดหมู่จะแสดงขึ้นเมื่อมีการเพิ่มเนื้อหา
            </p>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">เรียงตาม</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/movies" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
            >
              <Film className="h-6 w-6 mx-auto mb-2" />
              <span className="font-medium">หนังทั้งหมด</span>
            </Link>
            <Link 
              href="/series" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
            >
              <Tv className="h-6 w-6 mx-auto mb-2" />
              <span className="font-medium">ซีรี่ย์ทั้งหมด</span>
            </Link>
            <Link 
              href="/popular" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
            >
              <Badge className="h-6 w-6 mx-auto mb-2 rounded-full" />
              <span className="font-medium">ยอดนิยม</span>
            </Link>
            <Link 
              href="/latest" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
            >
              <Badge variant="outline" className="h-6 w-6 mx-auto mb-2 rounded-full" />
              <span className="font-medium">ล่าสุด</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Categories page error:', error);
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">หมวดหมู่</h1>
          <div className="text-center py-16">
            <h3 className="text-xl font-bold mb-2 text-red-600">เกิดข้อผิดพลาด</h3>
            <p className="text-muted-foreground">
              ไม่สามารถโหลดหมวดหมู่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }
}