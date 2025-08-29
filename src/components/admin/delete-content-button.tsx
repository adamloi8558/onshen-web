"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteContentButtonProps {
  contentId: string;
  contentTitle: string;
}

export default function DeleteContentButton({ contentId, contentTitle }: DeleteContentButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ที่จะลบเนื้อหา "${contentTitle}"?\n\nการกระทำนี้ไม่สามารถยกเลิกได้`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "ลบเนื้อหาสำเร็จ");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error('Delete content error:', error);
      toast.error("เกิดข้อผิดพลาดในการลบเนื้อหา");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}