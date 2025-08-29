import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { content, categories } from "@/lib/db/schema";
import { desc, eq, like, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContentFilters from "@/components/admin/content-filters";
import DeleteContentButton from "@/components/admin/delete-content-button";
import Link from "next/link";
import Image from "next/image";
import { 
  Plus,
  Edit3,
  Eye,
  Play,
  Film,
  Tv
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "จัดการเนื้อหา - แอดมิน",
  description: "จัดการหนัง ซีรี่ย์ และเนื้อหาทั้งหมด",
};

interface ContentFilters {
  search?: string;
  type?: string;
  status?: string;
  category?: string;
}

async function getContent(filters: ContentFilters = {}) {
  try {
    // Build base query
    const baseQuery = db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        description: content.description,
        type: content.type,
        status: content.status,
        content_rating: content.content_rating,
        poster_url: content.poster_url,
        views: content.views,
        saves: content.saves,
        total_episodes: content.total_episodes,
        is_vip_required: content.is_vip_required,
        created_at: content.created_at,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        }
      })
      .from(content)
      .leftJoin(categories, eq(content.category_id, categories.id));

    // Apply filters
    const whereConditions = [];

    if (filters.search) {
      whereConditions.push(like(content.title, `%${filters.search}%`));
    }

    if (filters.type && filters.type !== 'all' && (filters.type === 'movie' || filters.type === 'series')) {
      whereConditions.push(eq(content.type, filters.type));
    }

    if (filters.status && filters.status !== 'all' && ['draft', 'published', 'archived'].includes(filters.status)) {
      whereConditions.push(eq(content.status, filters.status as 'draft' | 'published' | 'archived'));
    }

    if (filters.category && filters.category !== 'all') {
      whereConditions.push(eq(content.category_id, filters.category));
    }

    // Execute query with or without filters
    if (whereConditions.length > 0) {
      return await baseQuery
        .where(and(...whereConditions)!)
        .orderBy(desc(content.created_at))
        .limit(50);
    } else {
      return await baseQuery
        .orderBy(desc(content.created_at))
        .limit(50);
    }

  } catch (error) {
    console.error('Error fetching content:', error);
    return [];
  }
}

async function getCategories() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(categories.name);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

interface ContentPageProps {
  searchParams: {
    search?: string;
    type?: string;
    status?: string;
    category?: string;
  };
}

export default async function ContentManagement({ searchParams }: ContentPageProps) {
  await requireAdmin();
  
  const filters: ContentFilters = {
    search: searchParams.search,
    type: searchParams.type,
    status: searchParams.status,
    category: searchParams.category,
  };

  const [contentList, categoriesList] = await Promise.all([
    getContent(filters),
    getCategories()
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500 text-white';
      case 'draft': return 'bg-yellow-500 text-white';
      case 'archived': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'เผยแพร่';
      case 'draft': return 'ร่าง';
      case 'archived': return 'เก็บ';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">จัดการเนื้อหา</h1>
            <p className="text-muted-foreground">
              จัดการหนัง ซีรี่ย์ และเนื้อหาทั้งหมด
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/content/new">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มเนื้อหา
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">
                กลับแดชบอร์ด
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">ค้นหาและกรอง</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentFilters categories={categoriesList} />
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contentList.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[2/3] relative">
                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {item.type === 'movie' ? (
                      <Film className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <Tv className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}
                  </Badge>
                  {item.is_vip_required && (
                    <Badge className="text-xs bg-yellow-500 text-white">
                      VIP
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.views}
                  </div>
                  {item.type === 'series' && item.total_episodes && (
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {item.total_episodes} ตอน
                    </div>
                  )}
                </div>
                {item.category && (
                  <Badge variant="outline" className="text-xs mb-3">
                    {item.category.name}
                  </Badge>
                )}
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/content/${item.id}/edit`}>
                      <Edit3 className="h-3 w-3 mr-1" />
                      แก้ไข
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/${item.type === 'movie' ? 'movies' : 'series'}/${item.slug}`}>
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                  <DeleteContentButton 
                    contentId={item.id} 
                    contentTitle={item.title} 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {contentList.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบเนื้อหา</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.type || filters.status || filters.category
                  ? "ไม่พบเนื้อหาที่ตรงตามเงื่อนไขการค้นหา"
                  : "ยังไม่มีเนื้อหาในระบบ"
                }
              </p>
              <Button asChild>
                <Link href="/admin/content/new">
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มเนื้อหาแรก
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}