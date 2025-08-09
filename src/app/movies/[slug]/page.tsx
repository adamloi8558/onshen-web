import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db, content, categories, episodes } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Bookmark, 
  BookmarkCheck, 
  Eye, 
  Calendar, 
  Clock, 
  Star,
  Crown 
} from "lucide-react";

interface MoviePageProps {
  params: {
    slug: string;
  };
}

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return {
      title: "หนัง",
      description: "ดูหนังออนไลน์คุณภาพ HD",
    };
  }

  const [movie] = await db
    .select({
      title: content.title,
      description: content.description,
      poster_url: content.poster_url,
      backdrop_url: content.backdrop_url,
    })
    .from(content)
    .where(and(
      eq(content.slug, params.slug),
      eq(content.type, 'movie'),
      eq(content.status, 'published')
    ))
    .limit(1);

  if (!movie) {
    return {
      title: "ไม่พบหนัง",
      description: "ไม่พบหนังที่คุณค้นหา",
    };
  }

  return {
    title: `${movie.title} - MovieFlix`,
    description: movie.description || `ดูหนัง ${movie.title} ออนไลน์คุณภาพ HD`,
    openGraph: {
      title: `${movie.title} - MovieFlix`,
      description: movie.description || `ดูหนัง ${movie.title} ออนไลน์คุณภาพ HD`,
      images: [movie.poster_url || "/og-movie-default.jpg"],
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: `${movie.title} - MovieFlix`,
      description: movie.description || `ดูหนัง ${movie.title} ออนไลน์คุณภาพ HD`,
      images: [movie.poster_url || "/og-movie-default.jpg"],
    },
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const user = await getCurrentUser();

  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">หนัง</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Get movie details
  const [movie] = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      backdrop_url: content.backdrop_url,
      trailer_url: content.trailer_url,
      video_url: content.video_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
      release_date: content.release_date,
      duration_minutes: content.duration_minutes,
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
      eq(content.type, 'movie'),
      eq(content.status, 'published')
    ))
    .limit(1);

  if (!movie) {
    notFound();
  }

  // Get related movies
  const relatedMovies = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      poster_url: content.poster_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
    })
    .from(content)
    .where(and(
      eq(content.type, 'movie'),
      eq(content.status, 'published'),
      eq(content.category_id, movie.category?.id || '')
    ))
    .orderBy(desc(content.views))
    .limit(6);

  const canWatch = user && (!movie.is_vip_required || user.is_vip);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        {movie.backdrop_url && (
          <Image
            src={movie.backdrop_url}
            alt={movie.title}
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
                {movie.poster_url && (
                  <Image
                    src={movie.poster_url}
                    alt={movie.title}
                    width={200}
                    height={300}
                    className="rounded-lg shadow-2xl"
                  />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{movie.content_rating}</Badge>
                  {movie.category && (
                    <Badge variant="outline">{movie.category.name}</Badge>
                  )}
                  {movie.is_vip_required && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-white">
                  {movie.title}
                </h1>
                
                <div className="flex items-center gap-6 text-white/80">
                  {movie.release_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  )}
                  {movie.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{movie.views.toLocaleString()} views</span>
                  </div>
                </div>
                
                {movie.description && (
                  <p className="text-white/90 text-lg max-w-2xl line-clamp-3">
                    {movie.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4">
                  {canWatch ? (
                    <Button size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      ดูหนัง
                    </Button>
                  ) : (
                    <Button size="lg" variant="secondary" asChild>
                      <Link href={movie.is_vip_required ? "/vip" : "/auth/login"}>
                        {movie.is_vip_required ? "สมัครสมาชิก VIP" : "เข้าสู่ระบบเพื่อดู"}
                      </Link>
                    </Button>
                  )}
                  
                  {movie.trailer_url && (
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
            {movie.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">เรื่องย่อ</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-8">
            {/* Movie Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">ข้อมูลภาพยนตร์</h3>
                <div className="space-y-3">
                  {movie.category && (
                    <div>
                      <span className="font-medium">หมวดหมู่:</span>
                      <span className="ml-2 text-muted-foreground">{movie.category.name}</span>
                    </div>
                  )}
                  {movie.release_date && (
                    <div>
                      <span className="font-medium">วันที่เข้าฉาย:</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Date(movie.release_date).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  )}
                  {movie.duration_minutes && (
                    <div>
                      <span className="font-medium">ระยะเวลา:</span>
                      <span className="ml-2 text-muted-foreground">
                        {Math.floor(movie.duration_minutes / 60)} ชั่วโมง {movie.duration_minutes % 60} นาที
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">เรทติ้ง:</span>
                    <span className="ml-2 text-muted-foreground">{movie.content_rating}</span>
                  </div>
                  <div>
                    <span className="font-medium">ยอดชม:</span>
                    <span className="ml-2 text-muted-foreground">{movie.views.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">ยอดบันทึก:</span>
                    <span className="ml-2 text-muted-foreground">{movie.saves.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Related Movies */}
            {relatedMovies.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">หนังที่เกี่ยวข้อง</h3>
                  <div className="space-y-4">
                    {relatedMovies.slice(0, 4).map((relatedMovie) => (
                      <Link
                        key={relatedMovie.id}
                        href={`/movies/${relatedMovie.slug}`}
                        className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {relatedMovie.poster_url && (
                          <Image
                            src={relatedMovie.poster_url}
                            alt={relatedMovie.title}
                            width={60}
                            height={90}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{relatedMovie.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {relatedMovie.content_rating}
                            </Badge>
                            {relatedMovie.is_vip_required && (
                              <Badge variant="outline" className="text-xs">
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {relatedMovie.views.toLocaleString()} views
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
}