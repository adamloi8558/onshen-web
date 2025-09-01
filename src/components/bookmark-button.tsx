'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  contentId: string;
  user: { id: string } | null;
  initialSaved?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function BookmarkButton({
  contentId,
  user,
  initialSaved = false,
  variant = 'outline',
  size = 'default',
  className = '',
  showText = true,
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  // Check bookmark status on mount
  useEffect(() => {
    if (!user) return;

    const checkBookmarkStatus = async () => {
      try {
        const response = await fetch(`/api/content/${contentId}/bookmark`);
        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.is_saved);
        }
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      }
    };

    checkBookmarkStatus();
  }, [contentId, user]);

  const handleBookmark = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`/api/content/${contentId}/bookmark`, {
        method,
      });

      const data = await response.json();

      if (response.ok) {
        setIsSaved(data.is_saved);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = isSaved ? Bookmark : BookmarkPlus;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleBookmark}
      disabled={isLoading || !user}
    >
      <IconComponent className={`h-5 w-5 ${showText ? 'mr-2' : ''} ${isSaved ? 'fill-current' : ''}`} />
      {showText && (isSaved ? 'บันทึกแล้ว' : 'บันทึก')}
    </Button>
  );
}