import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Crown, Star } from "lucide-react";

interface HeroProps {
  content: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    type: 'movie' | 'series';
    poster_url: string | null;
    backdrop_url: string | null;
    video_url: string | null;
    content_rating: string;
    is_vip_required: boolean;
    views: number;
    saves: number;
  };
  user: {
    id: string;
    is_vip: boolean;
  } | null;
}

export default function Hero({ content, user }: HeroProps) {
  const canWatch = !content.is_vip_required || (user?.is_vip);
  const watchUrl = content.type === 'movie' 
    ? `/movies/${content.slug}` 
    : `/series/${content.slug}`;

  return (
    <div className="relative h-[70vh] overflow-hidden">
      {/* Background Image - Use poster if no backdrop */}
      {(content.backdrop_url || content.poster_url) && (
        <Image
          src={(content.backdrop_url || content.poster_url)!}
          alt={content.title}
          fill
          className="object-cover"
          priority
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container">
          <div className="max-w-2xl space-y-6">
            {/* Badges */}
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                {content.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {content.content_rating}
              </span>
              {content.is_vip_required && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                  <Crown className="w-3 h-3 mr-1" />
                  VIP
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {content.title}
            </h1>

            {/* Description */}
            {content.description && (
              <p className="text-lg text-gray-200 line-clamp-3 max-w-xl">
                {content.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{content.views.toLocaleString()} ครั้ง</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>{content.saves.toLocaleString()} คน</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {canWatch ? (
                <Button size="lg" asChild className="bg-white text-black hover:bg-gray-200">
                  <Link href={watchUrl}>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    เล่น
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700">
                  <Link href="/vip">
                    <Crown className="w-5 h-5 mr-2" />
                    สมัครสมาชิก VIP
                  </Link>
                </Button>
              )}


            </div>

            {/* VIP Notice */}
            {content.is_vip_required && !user?.is_vip && (
              <div className="bg-yellow-900/50 border border-yellow-600/50 rounded-lg p-4 text-yellow-200">
                <p className="text-sm">
                  <Crown className="w-4 h-4 inline mr-1" />
                  เนื้อหานี้สำหรับสมาชิก VIP เท่านั้น สมัครสมาชิกเพียง 39 บาทต่อเดือน
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}