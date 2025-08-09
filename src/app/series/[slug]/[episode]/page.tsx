import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db, content, episodes } from "@/lib/db";
import { eq, and, asc, gt, lt } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  SkipBack, 
  SkipForward, 
  Home,
  List,
  Crown,
  Eye,
  Clock
} from "lucide-react";

interface EpisodePageProps {
  params: {
    slug: string;
    episode: string; // Format: "1.2" (season.episode)
  };
}

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

function parseEpisodeNumber(episodeStr: string): { season: number; episode: number } {
  const parts = episodeStr.split('.');
  return {
    season: parseInt(parts[0]) || 1,
    episode: parseInt(parts[1]) || 1,
  };
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return {
      title: "ซีรี่ย์",
      description: "ดูซีรี่ย์ออนไลน์คุณภาพ HD",
    };
  }

  const { season, episode: episodeNum } = parseEpisodeNumber(params.episode);

  const [series] = await db
    .select({
      title: content.title,
      poster_url: content.poster_url,
    })
    .from(content)
    .where(and(
      eq(content.slug, params.slug),
      eq(content.type, 'series'),
      eq(content.status, 'published')
    ))
    .limit(1);

  if (!series) {
    return {
      title: "ไม่พบซีรี่ย์",
      description: "ไม่พบซีรี่ย์ที่คุณค้นหา",
    };
  }

  const [episode] = await db
    .select({
      title: episodes.title,
      description: episodes.description,
    })
    .from(episodes)
    .innerJoin(content, eq(episodes.content_id, content.id))
    .where(and(
      eq(content.slug, params.slug),
      eq(episodes.season_number, season),
      eq(episodes.episode_number, episodeNum)
    ))
    .limit(1);

  return {
    title: `${series.title} - ตอนที่ ${episodeNum}: ${episode?.title || 'ไม่มีชื่อ'} - MovieFlix`,
    description: episode?.description || `ดู ${series.title} ตอนที่ ${episodeNum} ออนไลน์คุณภาพ HD`,
    openGraph: {
      title: `${series.title} - ตอนที่ ${episodeNum}: ${episode?.title || 'ไม่มีชื่อ'}`,
      description: episode?.description || `ดู ${series.title} ตอนที่ ${episodeNum} ออนไลน์คุณภาพ HD`,
      images: [series.poster_url || "/og-episode-default.jpg"],
      type: "video.episode",
    },
  };
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const user = await getCurrentUser();
  const { season, episode: episodeNum } = parseEpisodeNumber(params.episode);

  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">ซีรี่ย์</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Get series info
  const [series] = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      poster_url: content.poster_url,
      is_vip_required: content.is_vip_required,
    })
    .from(content)
    .where(and(
      eq(content.slug, params.slug),
      eq(content.type, 'series'),
      eq(content.status, 'published')
    ))
    .limit(1);

  if (!series) {
    notFound();
  }

  // Get current episode
  const [currentEpisode] = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      episode_number: episodes.episode_number,
      season_number: episodes.season_number,
      description: episodes.description,
      thumbnail_url: episodes.thumbnail_url,
      video_url: episodes.video_url,
      duration_minutes: episodes.duration_minutes,
      is_vip_required: episodes.is_vip_required,
      views: episodes.views,
    })
    .from(episodes)
    .where(and(
      eq(episodes.content_id, series.id),
      eq(episodes.season_number, season),
      eq(episodes.episode_number, episodeNum)
    ))
    .limit(1);

  if (!currentEpisode) {
    notFound();
  }

  // Get previous episode
  const [prevEpisode] = await db
    .select({
      season_number: episodes.season_number,
      episode_number: episodes.episode_number,
    })
    .from(episodes)
    .where(and(
      eq(episodes.content_id, series.id),
      lt(episodes.episode_number, episodeNum)
    ))
    .orderBy(asc(episodes.season_number), asc(episodes.episode_number))
    .limit(1);

  // Get next episode
  const [nextEpisode] = await db
    .select({
      season_number: episodes.season_number,
      episode_number: episodes.episode_number,
    })
    .from(episodes)
    .where(and(
      eq(episodes.content_id, series.id),
      gt(episodes.episode_number, episodeNum)
    ))
    .orderBy(asc(episodes.season_number), asc(episodes.episode_number))
    .limit(1);

  // Get all episodes for navigation
  const allEpisodes = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      episode_number: episodes.episode_number,
      season_number: episodes.season_number,
      thumbnail_url: episodes.thumbnail_url,
      duration_minutes: episodes.duration_minutes,
      is_vip_required: episodes.is_vip_required,
      views: episodes.views,
    })
    .from(episodes)
    .where(eq(episodes.content_id, series.id))
    .orderBy(asc(episodes.season_number), asc(episodes.episode_number));

  const canWatch = user && (!currentEpisode.is_vip_required || user.is_vip) && (!series.is_vip_required || user.is_vip);

  return (
    <div className="min-h-screen">
      {/* Video Player Section */}
      <div className="relative bg-black">
        <div className="container">
          <div className="aspect-video bg-black flex items-center justify-center">
            {canWatch ? (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">Video Player จะอยู่ตรงนี้</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {currentEpisode.video_url ? 'พร้อมเล่น' : 'กำลังประมวลผล...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-white">
                <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-bold mb-2">
                  {currentEpisode.is_vip_required ? 'ต้องการสมาชิก VIP' : 'เข้าสู่ระบบเพื่อดู'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {currentEpisode.is_vip_required 
                    ? 'เนื้อหานี้สำหรับสมาชิก VIP เท่านั้น' 
                    : 'กรุณาเข้าสู่ระบบเพื่อดูเนื้อหา'
                  }
                </p>
                <Button asChild>
                  <Link href={currentEpisode.is_vip_required ? "/vip" : "/auth/login"}>
                    {currentEpisode.is_vip_required ? "สมัครสมาชิก VIP" : "เข้าสู่ระบบ"}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Episode Info and Controls */}
      <div className="border-b bg-background/95">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  href={`/series/${series.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {series.title}
                </Link>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">ซีซั่น {season}</span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                ตอนที่ {episodeNum}: {currentEpisode.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {currentEpisode.duration_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{currentEpisode.duration_minutes} นาที</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{currentEpisode.views.toLocaleString()} views</span>
                </div>
                {currentEpisode.is_vip_required && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/series/${series.slug}`}>
                  <List className="h-4 w-4 mr-2" />
                  ตอนทั้งหมด
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  หน้าแรก
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div>
              {prevEpisode ? (
                <Button variant="outline" asChild>
                  <Link href={`/series/${series.slug}/${prevEpisode.season_number}.${prevEpisode.episode_number}`}>
                    <SkipBack className="h-4 w-4 mr-2" />
                    ตอนก่อนหน้า
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <SkipBack className="h-4 w-4 mr-2" />
                  ตอนก่อนหน้า
                </Button>
              )}
            </div>
            
            <div>
              {nextEpisode ? (
                <Button asChild>
                  <Link href={`/series/${series.slug}/${nextEpisode.season_number}.${nextEpisode.episode_number}`}>
                    ตอนถัดไป
                    <SkipForward className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button disabled>
                  ตอนถัดไป
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Episode Description */}
            {currentEpisode.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">เรื่องย่อตอนนี้</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentEpisode.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div>
            {/* Episodes List */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">ตอนอื่นๆ</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allEpisodes.map((ep) => {
                    const isCurrentEpisode = ep.season_number === season && ep.episode_number === episodeNum;
                    const episodeCanWatch = user && (!ep.is_vip_required || user.is_vip);
                    
                    return (
                      <div
                        key={ep.id}
                        className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                          isCurrentEpisode 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {ep.thumbnail_url && (
                          <div className="flex-shrink-0">
                            <Image
                              src={ep.thumbnail_url}
                              alt={ep.title}
                              width={80}
                              height={45}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            ตอนที่ {ep.episode_number}: {ep.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {ep.duration_minutes && (
                              <span className="text-xs text-muted-foreground">
                                {ep.duration_minutes} นาที
                              </span>
                            )}
                            {ep.is_vip_required && (
                              <Badge variant="outline" className="text-xs">
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ep.views.toLocaleString()} views
                          </p>
                        </div>
                        
                        {!isCurrentEpisode && (
                          <div className="flex-shrink-0">
                            {episodeCanWatch ? (
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/series/${series.slug}/${ep.season_number}.${ep.episode_number}`}>
                                  <Play className="h-3 w-3" />
                                </Link>
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" disabled>
                                <Crown className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}