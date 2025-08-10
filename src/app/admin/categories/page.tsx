import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, content } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  Plus,
  Edit3,
  Trash2,
  Folder,
  Search
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "จัดการหมวดหมู่ - แอดมิน",
  description: "จัดการหมวดหมู่เนื้อหา",
};

async function getCategories() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        created_at: categories.created_at,
        content_count: count(content.id),
      })
      .from(categories)
      .leftJoin(content, eq(categories.id, content.category_id))
      .groupBy(categories.id, categories.name, categories.slug, categories.description, categories.created_at)
      .orderBy(desc(categories.created_at));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function CategoriesManagement() {
  await requireAdmin();
  const categoriesList = await getCategories();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">จัดการหมวดหมู่</h1>
            <p className="text-muted-foreground">
              จัดการหมวดหมู่เนื้อหาในระบบ
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/categories/new">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มหมวดหมู่
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">
                กลับแดชบอร์ด
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">ค้นหาหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    name="search"
                    placeholder="ค้นหาชื่อหมวดหมู่..."
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                ค้นหา
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="space-y-4">
          {categoriesList.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{category.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {category.content_count} เนื้อหา
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Slug: <code className="bg-muted px-2 py-1 rounded text-sm">{category.slug}</code>
                      </p>
                      {category.description && (
                        <p className="text-muted-foreground mb-2">
                          {category.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        สร้างเมื่อ: {formatDate(category.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/categories/${category.id}/edit`}>
                        <Edit3 className="h-4 w-4 mr-1" />
                        แก้ไข
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/categories/${category.slug}`}>
                        ดูหมวดหมู่
                      </Link>
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {categoriesList.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่มีหมวดหมู่</h3>
              <p className="text-muted-foreground mb-4">
                ยังไม่มีหมวดหมู่ในระบบ เริ่มต้นด้วยการเพิ่มหมวดหมู่แรก
              </p>
              <Button asChild>
                <Link href="/admin/categories/new">
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มหมวดหมู่แรก
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}