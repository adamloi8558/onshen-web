import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ArrowLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import UploadForm from "@/components/admin/upload-form";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `อัปโหลดไฟล์ - แอดมิน`,
    description: "อัปโหลดไฟล์วิดีโอสำหรับเนื้อหา",
  };
}

async function getContentById(id: string) {
  try {
    const [contentItem] = await db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        type: content.type,
        status: content.status,
        poster_url: content.poster_url,
        video_url: content.video_url,
        total_episodes: content.total_episodes,
        created_at: content.created_at,
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

export default async function UploadContentPage({ params }: PageProps) {
  await requireAdmin();

  const contentItem = await getContentById(params.id);

  if (!contentItem) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <div className="container space-y-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/content/${params.id}/edit`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Upload className="h-8 w-8" />
              <h1 className="text-4xl font-bold">อัปโหลดไฟล์</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              อัปโหลดไฟล์วิดีโอสำหรับ: {contentItem.title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลเนื้อหา</CardTitle>
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

                <div className="space-y-2">
                  <h3 className="font-medium">{contentItem.title}</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ประเภท:</span>
                      <span>{contentItem.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">สถานะ:</span>
                      <span className="capitalize">{contentItem.status}</span>
                    </div>
                    {contentItem.type === 'series' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">จำนวนตอน:</span>
                        <span>{contentItem.total_episodes || 0}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">วิดีโอหลัก:</span>
                      <span className={contentItem.video_url ? 'text-green-600' : 'text-red-600'}>
                        {contentItem.video_url ? 'มีแล้ว' : 'ยังไม่มี'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/admin/content/${params.id}/edit`}>
                      กลับไปแก้ไขข้อมูล
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  อัปโหลดไฟล์วิดีโอ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadForm 
                  contentId={contentItem.id}
                  contentType={contentItem.type}
                  contentTitle={contentItem.title}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}