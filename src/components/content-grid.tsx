import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Play, Eye, BookmarkIcon } from "lucide-react";

interface ContentGridProps {
  content: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    type: 'movie' | 'series';
    poster_url: string | null;
    content_rating: string | null;
    is_vip_required: boolean;
    views: number;
    saves: number;
    total_episodes?: number | null;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
  showType?: boolean;
}

export default function ContentGrid({ content, showType = true }: ContentGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {content.map((item) => {
        const href = item.type === 'movie' 
          ? `/movies/${item.slug}` 
          : `/series/${item.slug}`;

        return (
          <Link key={item.id} href={href} className="group">
            <Card className="overflow-hidden border-0 bg-transparent">
              <CardContent className="p-0">
                <div className="relative aspect-poster overflow-hidden rounded-lg">
                  {item.poster_url ? (
                    <Image
                      src={item.poster_url}
                      alt={item.title}
                      fill
                      className="object-cover transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>

                  {/* VIP Badge */}
                  {item.is_vip_required && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-0">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    </div>
                  )}

                  {/* Content Type Badge */}
                  {showType && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}
                      </Badge>
                    </div>
                  )}

                  {/* Episode Count for Series */}
                  {item.type === 'series' && item.total_episodes && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="outline" className="bg-black/80 text-white border-white/20 text-xs">
                        {item.total_episodes} ตอน
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="pt-3 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Category */}
                  {item.category && (
                    <p className="text-xs text-muted-foreground">
                      {item.category.name}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{item.views > 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookmarkIcon className="w-3 h-3" />
                      <span>{item.saves > 1000 ? `${(item.saves / 1000).toFixed(1)}k` : item.saves}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {item.content_rating}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}