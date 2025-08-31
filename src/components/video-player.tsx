"use client";

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export default function VideoPlayer({ 
  src, 
  poster, 
  title, 
  autoplay = false,
  className = ""
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);

    console.log('Loading video:', src);

    // Detect file type from URL
    const isHLS = src.includes('.m3u8') || src.includes('/hls/');
    const isMP4 = src.includes('.mp4') || src.includes('.webm') || src.includes('.mkv');

    console.log('Video type detection:', { isHLS, isMP4, src });

    // Try HLS first if it's an HLS file or HLS is supported
    if (isHLS && Hls.isSupported()) {
      console.log('Using HLS.js for:', src);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hlsRef.current = hls;
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded successfully');
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(console.error);
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          console.log('Fatal HLS error, trying MP4 fallback...');
          // Try MP4 fallback
          hls.destroy();
          hlsRef.current = null;
          video.src = src;
          setIsLoading(false);
          if (autoplay) {
            video.play().catch(console.error);
          }
        }
      });
    } 
    // Safari native HLS support
    else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('Using Safari native HLS for:', src);
      video.src = src;
      setIsLoading(false);
      if (autoplay) {
        video.play().catch(console.error);
      }
    } 
    // Direct MP4/WebM/MKV playback
    else {
      console.log('Using direct video playback for:', src);
      video.src = src;
      setIsLoading(false);
      if (autoplay) {
        video.play().catch(console.error);
      }
    }

    // Video event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [src, autoplay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    } else {
      video.requestFullscreen().catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <RotateCcw className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">{error}</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            ลองใหม่
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>กำลังโหลดวิดีโอ...</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div 
          className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-red-600 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm font-medium mr-4">{title}</span>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}