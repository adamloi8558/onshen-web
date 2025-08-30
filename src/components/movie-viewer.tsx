"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, X } from "lucide-react";
import VideoPlayer from "./video-player";
import Link from "next/link";

interface Movie {
  id: string;
  title: string;
  video_url: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  is_vip_required: boolean;
}

interface User {
  id: string;
  is_vip: boolean;
}

interface MovieViewerProps {
  movie: Movie;
  user: User | null;
}

export default function MovieViewer({ movie, user }: MovieViewerProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [isWatchingTrailer, setIsWatchingTrailer] = useState(false);

  const canWatch = user && (!movie.is_vip_required || user.is_vip);

  const handleWatchMovie = () => {
    if (!canWatch || !movie.video_url) return;
    setIsWatching(true);
  };

  const handleWatchTrailer = () => {
    if (!movie.trailer_url) return;
    setIsWatchingTrailer(true);
  };

  // Full screen video player
  if (isWatching && movie.video_url) {
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
          src={movie.video_url}
          title={movie.title}
          poster={movie.poster_url || undefined}
          autoplay={true}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Trailer player
  if (isWatchingTrailer && movie.trailer_url) {
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
            src={movie.trailer_url}
            title={`${movie.title} - ตัวอย่าง`}
            poster={movie.poster_url || undefined}
            autoplay={true}
            className="w-full aspect-video"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Watch Movie Button */}
      {canWatch && movie.video_url ? (
        <Button size="lg" className="gap-2" onClick={handleWatchMovie}>
          <Play className="h-5 w-5" />
          ดูหนัง
        </Button>
      ) : !user ? (
        <Button size="lg" variant="secondary" asChild>
          <Link href="/auth/login">
            เข้าสู่ระบบเพื่อดู
          </Link>
        </Button>
      ) : movie.is_vip_required ? (
        <Button size="lg" variant="secondary" asChild>
          <Link href="/vip">
            สมัครสมาชิก VIP
          </Link>
        </Button>
      ) : (
        <Button size="lg" disabled>
          ยังไม่มีวิดีโอ
        </Button>
      )}
      
      {/* Watch Trailer Button */}
      {movie.trailer_url && (
        <Button size="lg" variant="outline" onClick={handleWatchTrailer}>
          ดูตัวอย่าง
        </Button>
      )}
    </div>
  );
}