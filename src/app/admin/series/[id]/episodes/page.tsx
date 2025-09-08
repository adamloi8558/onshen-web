import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db, content, episodes } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Play } from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [series] = await db
    .select({ title: content.title })
    .from(content)
    .where(eq(content.id, params.id))
    .limit(1);

  return {
    title: `จัดการตอน - ${series?.title || 'ซีรี่ย์'}`,
    description: "จัดการตอนซีรี่ย์",
  };
}

export default async function SeriesEpisodesPage({ params }: PageProps) {
  await requireAdmin();

  // Get series info
  const [series] = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      type: content.type,
      total_episodes: content.total_episodes,
    })
    .from(content)
    .where(eq(content.id, params.id))
    .limit(1);

  if (!series || series.type !== 'series') {
    notFound();
  }

  // Get all episodes
  const episodeList = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      episode_number: episodes.episode_number,
      description: episodes.description,
      duration_minutes: episodes.duration_minutes,
      is_vip_required: episodes.is_vip_required,
      video_url: episodes.video_url,
      views: episodes.views,
      created_at: episodes.created_at,
    })
    .from(episodes)
    .where(eq(episodes.content_id, series.id))
    .orderBy(desc(episodes.episode_number));

  // Auto-update total_episodes
  if (episodeList.length !== (series.total_episodes || 0)) {
    await db
      .update(content)
      .set({
        total_episodes: episodeList.length,
        updated_at: new Date(),
      })
      .where(eq(content.id, series.id));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/admin/content">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">จัดการตอน</h1>
            <p className="text-muted-foreground">
              {series.title} ({episodeList.length} ตอน)
            </p>
          </div>
          <Button asChild>
            <Link href={`/admin/series/${series.id}/episodes/new`}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มตอนใหม่
            </Link>
          </Button>
        </div>

        {/* Episodes List */}
        <div className="grid gap-4">
          {episodeList.length > 0 ? (
            episodeList.map((episode) => (
              <Card key={episode.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          ตอนที่ {episode.episode_number}
                        </Badge>
                        {episode.is_vip_required && (
                          <Badge className="bg-yellow-500 text-black">
                            VIP
                          </Badge>
                        )}
                        {episode.video_url && (
                          <Badge className="bg-green-500">
                            <Play className="h-3 w-3 mr-1" />
                            มีวิดีโอ
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        {episode.title}
                      </h3>
                      {episode.description && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {episode.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {episode.duration_minutes && (
                          <span>{episode.duration_minutes} นาที</span>
                        )}
                        <span>{episode.views.toLocaleString()} views</span>
                        <span>{new Date(episode.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/episodes/${episode.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/episodes/${episode.id}/upload`}>
                          <Plus className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">
                  ยังไม่มีตอนในซีรี่ย์นี้
                </p>
                <Button asChild>
                  <Link href={`/admin/series/${series.id}/episodes/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มตอนแรก
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}