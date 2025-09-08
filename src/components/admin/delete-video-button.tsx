"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { VideoOff } from "lucide-react";
import { toast } from "sonner";

interface DeleteVideoButtonProps {
  contentId: string;
  contentTitle: string;
}

export default function DeleteVideoButton({ contentId, contentTitle }: DeleteVideoButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteVideo = async () => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ที่จะลบวิดีโอของ "${contentTitle}"?\n\nเฉพาะไฟล์วิดีโอจะถูกลบ เรื่องจะยังคงอยู่`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/content/${contentId}/delete-video`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "ลบวิดีโอสำเร็จ");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error('Delete video error:', error);
      toast.error("เกิดข้อผิดพลาดในการลบวิดีโอ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={handleDeleteVideo}
      disabled={isDeleting}
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
    >
      <VideoOff className="h-3 w-3" />
    </Button>
  );
}