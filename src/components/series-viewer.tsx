"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
import VideoPlayer from "./video-player";
import BookmarkButton from "@/components/bookmark-button";
import { useViewTracker } from "@/hooks/use-view-tracker";
import Link from "next/link";

interface Episode {
  id: string;
  episode_number: string;
  title: string;
  video_url: string | null;
  is_vip_required: boolean;
}

interface Series {
  id: string;
  title: string;
  poster_url: string | null;
  trailer_url: string | null;
  is_vip_required: boolean;
}

interface User {
  id: string;
  is_vip: boolean;
}

interface SeriesViewerProps {
  series: Series;
  episode: Episode | null;
  user: User | null;
}

export default function SeriesViewer({ series, episode, user }: SeriesViewerProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [isWatchingTrailer, setIsWatchingTrailer] = useState(false);

  // Track views when component mounts
  useViewTracker({ 
    contentId: series.id,
    episodeId: episode?.id,
    enabled: true 
  });

  const canWatchEpisode = user && episode && (!episode.is_vip_required || user.is_vip);
  const canWatchTrailer = series.trailer_url;

  const handleWatchEpisode = () => {
    if (!canWatchEpisode || !episode?.video_url) return;
    setIsWatching(true);
  };

  const handleWatchTrailer = () => {
    if (!series.trailer_url) return;
    setIsWatchingTrailer(true);
  };

  // Full screen episode player
  if (isWatching && episode?.video_url) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWatching(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <VideoPlayer
          src={episode.video_url}
          title={`${series.title} - ตอนที่ ${episode.episode_number}: ${episode.title}`}
          poster={series.poster_url || undefined}
          autoplay={true}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Trailer player
  if (isWatchingTrailer && series.trailer_url) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWatchingTrailer(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <VideoPlayer
            src={series.trailer_url}
            title={`${series.title} - ตัวอย่าง`}
            poster={series.poster_url || undefined}
            autoplay={true}
            className="w-full aspect-video"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Watch Episode Button */}
      {canWatchEpisode && episode?.video_url ? (
        <Button size="lg" className="gap-2" onClick={handleWatchEpisode}>
          <Play className="h-5 w-5" />
          ดูตอนนี้
        </Button>
      ) : !user ? (
        <Button size="lg" variant="secondary" asChild>
          <Link href="/auth/login">
            เข้าสู่ระบบเพื่อดู
          </Link>
        </Button>
      ) : episode?.is_vip_required ? (
        <Button size="lg" variant="secondary" asChild>
          <Link href="/vip">
            สมัครสมาชิก VIP
          </Link>
        </Button>
      ) : (
        <Button size="lg" disabled>
          {episode ? "ยังไม่มีวิดีโอ" : "เลือกตอนที่ต้องการดู"}
        </Button>
      )}
      
      {/* Watch Trailer Button */}
      {canWatchTrailer && (
        <Button size="lg" variant="outline" onClick={handleWatchTrailer}>
          ดูตัวอย่าง
        </Button>
      )}
      
      {/* Bookmark Button */}
      <BookmarkButton
        contentId={series.id}
        user={user}
        variant="outline"
        size="lg"
      />
    </div>
  );
}