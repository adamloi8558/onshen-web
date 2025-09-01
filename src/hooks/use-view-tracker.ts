'use client';

import { useEffect, useRef } from 'react';

interface UseViewTrackerProps {
  contentId: string;
  episodeId?: string;
  enabled?: boolean;
}

export function useViewTracker({ 
  contentId, 
  episodeId, 
  enabled = true 
}: UseViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || hasTracked.current) return;

    const trackView = async () => {
      try {
        await fetch(`/api/content/${contentId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: episodeId ? 'episode' : 'content',
            episode_id: episodeId,
          }),
        });
        
        hasTracked.current = true;
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    // Track view after 3 seconds of page load
    const timer = setTimeout(trackView, 3000);

    return () => clearTimeout(timer);
  }, [contentId, episodeId, enabled]);

  return { hasTracked: hasTracked.current };
}