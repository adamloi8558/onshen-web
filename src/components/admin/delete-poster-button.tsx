"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeletePosterButtonProps {
  contentId: string;
  contentTitle: string;
}

export default function DeletePosterButton({ contentId, contentTitle }: DeletePosterButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePoster = async () => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ที่จะลบโปสเตอร์ของ "${contentTitle}"?`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/content/${contentId}/delete-poster`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "ลบโปสเตอร์สำเร็จ");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error('Delete poster error:', error);
      toast.error("เกิดข้อผิดพลาดในการลบโปสเตอร์");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="destructive"
      onClick={handleDeletePoster}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}