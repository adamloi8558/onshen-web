"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PosterUploadProps {
  currentPosterUrl?: string;
  onPosterChange: (url: string) => void;
}

export default function PosterUpload({ currentPosterUrl, onPosterChange }: PosterUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentPosterUrl || '');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("ขนาดภาพเกิน 10MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("กรุณาเลือกไฟล์ภาพ");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Get presigned URL
      toast.info("กำลังเตรียมการอัปโหลด...");
      
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
          fileType: 'poster',
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.error || 'ไม่สามารถเตรียมการอัปโหลดได้');
      }

      const { uploadUrl, publicUrl } = await presignedResponse.json();
      setUploadProgress(25);

      // Step 2: Upload file to R2
      toast.info("กำลังอัปโหลดภาพ...");
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('การอัปโหลดภาพล้มเหลว');
      }

      setUploadProgress(100);
      toast.success("อัปโหลดภาพปกสำเร็จ!");

      // Update parent component
      onPosterChange(publicUrl);
      
      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Poster upload error:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePoster = () => {
    setPreviewUrl('');
    onPosterChange('');
    setSelectedFile(null);
    toast.success("ลบภาพปกแล้ว");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          ภาพปก
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current/Preview Image */}
        {previewUrl && (
          <div className="relative">
            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden">
              <Image 
                src={previewUrl} 
                alt="Poster preview"
                width={200}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemovePoster}
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-3">
          <Label htmlFor="poster-file">อัปโหลดภาพปกใหม่</Label>
          <Input
            id="poster-file"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              <p>ไฟล์: {selectedFile.name}</p>
              <p>ขนาด: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>กำลังอัปโหลด...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพปก"}
          </Button>
        </div>

        {/* Guidelines */}
        <Alert>
          <ImageIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>คำแนะนำ:</strong> ใช้ภาพขนาด 300x450 pixels (อัตราส่วน 2:3) 
            สำหรับผลลัพธ์ที่ดีที่สุด
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}