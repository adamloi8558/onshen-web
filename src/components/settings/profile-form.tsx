"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Smartphone, Upload } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  phone: string;
  avatar_url: string | null;
}

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "/avatars/default.webp");

  const handleAvatarUpload = async () => {
    // TODO: Implement avatar upload
    toast.info("การอัพโหลดรูปโปรไฟล์จะพัฒนาในเร็วๆ นี้");
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: "/avatars/default.webp"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAvatarUrl("/avatars/default.webp");
        toast.success("ลบรูปโปรไฟล์สำเร็จ");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error('Delete avatar error:', error);
      toast.error("เกิดข้อผิดพลาดในการลบรูปโปรไฟล์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{user.phone.slice(-2)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">รูปโปรไฟล์</h3>
          <p className="text-sm text-muted-foreground">
            อัปโหลดรูปโปรไฟล์ใหม่ (ขนาดสูงสุด 5MB)
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleAvatarUpload}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              เปลี่ยนรูป
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-600 hover:text-red-700"
              onClick={handleDeleteAvatar}
              disabled={isLoading || avatarUrl === "/avatars/default.webp"}
            >
              ลบรูป
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          เบอร์โทรศัพท์
        </Label>
        <Input
          id="phone"
          type="tel"
          value={user.phone}
          readOnly
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          เบอร์โทรศัพท์ไม่สามารถเปลี่ยนแปลงได้
        </p>
      </div>
    </div>
  );
}