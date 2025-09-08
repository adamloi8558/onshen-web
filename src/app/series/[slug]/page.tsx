import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db, content, categories, episodes } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Bookmark, 
  Eye, 
  Calendar, 
  Crown,
  List
} from "lucide-react";

interface SeriesPageProps {
  params: {
    slug: string;
  };
}

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  try {
    // Skip database queries during build with placeholder database
    if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
      return {
        title: "ซีรี่ย์",
        description: "ดูซีรี่ย์ออนไลน์คุณภาพ HD",
      };
    }

    const [series] = await db
      .select({
        title: content.title,
        description: content.description,
        poster_url: content.poster_url,
        backdrop_url: content.backdrop_url,
        total_episodes: content.total_episodes,
      })
      .from(content)
      .where(and(
        eq(content.slug, params.slug),
        eq(content.type, 'series'),
        eq(content.status, 'published')
      )!)
      .limit(1);

  if (!series) {
    return {
      title: "ไม่พบซีรี่ย์",
      description: "ไม่พบซีรี่ย์ที่คุณค้นหา",
    };
  }

    return {
      title: `${series.title} - Ronglakorn`,
      description: series.description || `ดูซีรี่ย์ ${series.title} ออนไลน์คุณภาพ HD`,
      openGraph: {
        title: `${series.title} - Ronglakorn`,
        description: series.description || `ดูซีรี่ย์ ${series.title} ออนไลน์คุณภาพ HD`,
        images: [series.poster_url || "/og-series-default.jpg"],
        type: "video.tv_show",
      },
      twitter: {
        card: "summary_large_image",
        title: `${series.title} - Ronglakorn`,
        description: series.description || `ดูซีรี่ย์ ${series.title} ออนไลน์คุณภาพ HD`,
        images: [series.poster_url || "/og-series-default.jpg"],
      },
    };
  } catch (error) {
    console.error('Series metadata error:', error);
    return {
      title: "ซีรี่ย์ - Ronglakorn",
      description: "ดูซีรี่ย์ออนไลน์คุณภาพ HD",
    };
  }
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  try {
    const user = await getCurrentUser();

    // Skip database queries during build with placeholder database
    if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
      return (
        <div className="min-h-screen">
          <div className="container py-12">
            <h1 className="text-4xl font-bold mb-8">ซีรี่ย์</h1>
            <div className="text-center py-16">
              <p className="text-muted-foreground">รายละเอียดซีรี่ย์</p>
            </div>
          </div>
        </div>
      );
    }

  // Get series details
  const [series] = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      backdrop_url: content.backdrop_url,
      trailer_url: content.trailer_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
      release_date: content.release_date,
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
    .where(and(
      eq(content.slug, params.slug),
      eq(content.type, 'series'),
      eq(content.status, 'published')
    ))
    .limit(1);

  if (!series) {
    notFound();
  }

  // Get episodes
  const seriesEpisodes = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      episode_number: episodes.episode_number,
      description: episodes.description,
      thumbnail_url: episodes.thumbnail_url,
      video_url: episodes.video_url,
      duration_minutes: episodes.duration_minutes,
      is_vip_required: episodes.is_vip_required,
      views: episodes.views,
      created_at: episodes.created_at,
    })
    .from(episodes)
    .where(eq(episodes.content_id, series.id))
    .orderBy(asc(episodes.episode_number));

  // Get related series
  const relatedSeries = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      poster_url: content.poster_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      total_episodes: content.total_episodes,
    })
    .from(content)
    .where(and(
      eq(content.type, 'series'),
      eq(content.status, 'published'),
      eq(content.category_id, series.category?.id || '')
    ))
    .orderBy(desc(content.views))
    .limit(6);

  const canWatch = user && (!series.is_vip_required || user.is_vip);
  
  // All episodes (no grouping by season since we only store episode_number)
  const allEpisodes = seriesEpisodes;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        {series.backdrop_url && (
          <Image
            src={series.backdrop_url}
            alt={series.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster */}
              <div className="flex-shrink-0">
                {series.poster_url && (
                  <Image
                    src={series.poster_url}
                    alt={series.title}
                    width={200}
                    height={300}
                    className="rounded-lg shadow-2xl"
                  />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{series.content_rating}</Badge>
                  {series.category && (
                    <Badge variant="outline">{series.category.name}</Badge>
                  )}
                  {series.is_vip_required && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <List className="h-3 w-3 mr-1" />
                    {series.total_episodes || seriesEpisodes.length} ตอน
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-white">
                  {series.title}
                </h1>
                
                <div className="flex items-center gap-6 text-white/80">
                  {series.release_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(series.release_date).getFullYear()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{series.views.toLocaleString()} views</span>
                  </div>
                </div>
                
                {series.description && (
                  <p className="text-white/90 text-lg max-w-2xl line-clamp-3">
                    {series.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4">
                  {canWatch && seriesEpisodes.length > 0 ? (
                    <Button size="lg" className="gap-2" asChild>
                      <Link href={`/series/${series.slug}/${seriesEpisodes[0].episode_number}`}>
                        <Play className="h-5 w-5" />
                        เริ่มดู
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" variant="secondary" asChild>
                      <Link href={series.is_vip_required ? "/vip" : "/auth/login"}>
                        {series.is_vip_required ? "สมัครสมาชิก VIP" : "เข้าสู่ระบบเพื่อดู"}
                      </Link>
                    </Button>
                  )}
                  
                  {series.trailer_url && (
                    <Button size="lg" variant="outline">
                      ดูตัวอย่าง
                    </Button>
                  )}
                  
                  <Button size="lg" variant="ghost">
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {series.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">เรื่องย่อ</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {series.description}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Episodes */}
            {allEpisodes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">ตอนทั้งหมด</h2>
                  <div className="grid gap-4">
                    {allEpisodes.map((episode) => {
                            const episodeCanWatch = canWatch && (!episode.is_vip_required || user?.is_vip);
                            
                            return (
                              <div
                                key={episode.id}
                                className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                              >
                                {episode.thumbnail_url && (
                                  <div className="flex-shrink-0">
                                    <Image
                                      src={episode.thumbnail_url}
                                      alt={episode.title}
                                      width={120}
                                      height={70}
                                      className="rounded object-cover"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-medium truncate">
                                        ตอนที่ {episode.episode_number}: {episode.title}
                                      </h4>
                                      {episode.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {episode.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        {episode.duration_minutes && (
                                          <span>{episode.duration_minutes} นาที</span>
                                        )}
                                        <span>{episode.views.toLocaleString()} views</span>
                                        {episode.is_vip_required && (
                                          <Badge variant="outline" className="text-xs">
                                            VIP
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {episodeCanWatch ? (
                                      <Button size="sm" asChild>
                                        <Link href={`/series/${series.slug}/${episode.episode_number}`}>
                                          <Play className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" disabled>
                                        <Crown className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-8">
            {/* Series Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">ข้อมูลซีรี่ย์</h3>
                <div className="space-y-3">
                  {series.category && (
                    <div>
                      <span className="font-medium">หมวดหมู่:</span>
                      <span className="ml-2 text-muted-foreground">{series.category.name}</span>
                    </div>
                  )}
                  {series.release_date && (
                    <div>
                      <span className="font-medium">วันที่เข้าฉาย:</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Date(series.release_date).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">จำนวนตอน:</span>
                    <span className="ml-2 text-muted-foreground">
                      {series.total_episodes || seriesEpisodes.length} ตอน
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">เรทติ้ง:</span>
                    <span className="ml-2 text-muted-foreground">{series.content_rating}</span>
                  </div>
                  <div>
                    <span className="font-medium">ยอดชม:</span>
                    <span className="ml-2 text-muted-foreground">{series.views.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">ยอดบันทึก:</span>
                    <span className="ml-2 text-muted-foreground">{series.saves.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Related Series */}
            {relatedSeries.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">ซีรี่ย์ที่เกี่ยวข้อง</h3>
                  <div className="space-y-4">
                    {relatedSeries.slice(0, 4).map((relatedSeries) => (
                      <Link
                        key={relatedSeries.id}
                        href={`/series/${relatedSeries.slug}`}
                        className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {relatedSeries.poster_url && (
                          <Image
                            src={relatedSeries.poster_url}
                            alt={relatedSeries.title}
                            width={60}
                            height={90}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{relatedSeries.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {relatedSeries.content_rating}
                            </Badge>
                            {relatedSeries.is_vip_required && (
                              <Badge variant="outline" className="text-xs">
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {relatedSeries.total_episodes} ตอน • {relatedSeries.views.toLocaleString()} views
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Series page error:', error);
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">ซีรี่ย์</h1>
          <p className="text-muted-foreground">
            เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง
          </p>
        </div>
      </div>
    );
  }
}