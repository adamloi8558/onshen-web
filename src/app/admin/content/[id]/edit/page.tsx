import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { content, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ContentForm } from "@/components/admin/content-form";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `แก้ไขเนื้อหา - แอดมิน`,
    description: "แก้ไขข้อมูลเนื้อหา หนัง และซีรี่ย์",
  };
}

async function getContentById(id: string) {
  try {
    const [contentItem] = await db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        description: content.description,
        type: content.type,
        status: content.status,
        content_rating: content.content_rating,
        poster_url: content.poster_url,
        backdrop_url: content.backdrop_url,
        trailer_url: content.trailer_url,
        video_url: content.video_url,
        release_date: content.release_date,
        duration_minutes: content.duration_minutes,
        total_episodes: content.total_episodes,
        views: content.views,
        saves: content.saves,
        is_vip_required: content.is_vip_required,
        category_id: content.category_id,
        created_at: content.created_at,
        updated_at: content.updated_at,
      })
      .from(content)
      .where(eq(content.id, id))
      .limit(1);

    return contentItem || null;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
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

export default async function EditContentPage({ params }: PageProps) {
  await requireAdmin();

  const [contentItem, categoriesList] = await Promise.all([
    getContentById(params.id),
    getCategories()
  ]);

  if (!contentItem) {
    notFound();
  }

  // Prepare initial data for form
  const initialData = {
    id: contentItem.id,
    title: contentItem.title,
    slug: contentItem.slug,
    description: contentItem.description || '',
    type: contentItem.type,
    status: contentItem.status,
    content_rating: contentItem.content_rating,
    category_id: contentItem.category_id || '',
    is_vip_required: contentItem.is_vip_required,
    duration_minutes: contentItem.duration_minutes || undefined,
    total_episodes: contentItem.total_episodes || undefined,
    release_date: contentItem.release_date 
      ? new Date(contentItem.release_date).toISOString().split('T')[0]
      : '',
    poster_url: contentItem.poster_url || '',
  };

  return (
    <div className="min-h-screen">
      <div className="container space-y-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/content">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8" />
              <h1 className="text-4xl font-bold">แก้ไขเนื้อหา</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              แก้ไขข้อมูล: {contentItem.title}
            </p>
          </div>
        </div>

        {/* Content Info */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>ตัวอย่าง</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[2/3] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {contentItem.poster_url ? (
                    <Image 
                      src={contentItem.poster_url} 
                      alt={contentItem.title}
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{contentItem.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ประเภท:</span>
                    <span>{contentItem.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สถานะ:</span>
                    <span className="capitalize">{contentItem.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยอดชม:</span>
                    <span>{contentItem.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยอดบันทึก:</span>
                    <span>{contentItem.saves.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สร้างเมื่อ:</span>
                    <span>{new Date(contentItem.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">อัพเดตล่าสุด:</span>
                    <span>{new Date(contentItem.updated_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>แก้ไขข้อมูล</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentForm 
                  categories={categoriesList} 
                  initialData={initialData}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}