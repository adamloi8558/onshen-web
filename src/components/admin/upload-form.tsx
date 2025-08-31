"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileVideo, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface UploadFormProps {
  contentId: string;
  contentType: 'movie' | 'series';
  contentTitle: string;
}

export default function UploadForm({ contentId }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mkv', 'video/x-matroska', 'application/x-matroska'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Check by MIME type or extension
    const isValidType = allowedTypes.includes(file.type) || 
                       (fileExtension && ['mp4', 'webm', 'mkv'].includes(fileExtension));
    
    if (!isValidType) {
      toast.error(`รองรับเฉพาะไฟล์ MP4, WebM, MKV เท่านั้น (ไฟล์ของคุณ: ${file.type || 'unknown'})`);
      return;
    }

    // Validate file size (5GB)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      toast.error("ขนาดไฟล์เกิน 5GB");
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Step 1: Get presigned URL
      toast.info("กำลังเตรียมการอัปโหลด...");
      
      const presignedResponse = await fetch('/api/test-upload-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
          fileType: 'video',
          contentId: contentId,
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.error || 'ไม่สามารถเตรียมการอัปโหลดได้');
      }

      const responseData = await presignedResponse.json();
      const { uploadUrl } = responseData.data || responseData;

      // Step 2: Upload file to R2
      toast.info("กำลังอัปโหลดไฟล์...");
      setUploadProgress(25);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('การอัปโหลดไฟล์ล้มเหลว');
      }

      setUploadProgress(75);
      toast.info("อัปโหลดสำเร็จ! กำลังอัพเดตฐานข้อมูล...");

      // Step 3: Update content video_url in database
      try {
        const updateResponse = await fetch(`/api/admin/content/${contentId}/set-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: responseData.data?.fileUrl || responseData.fileUrl
          }),
        });

        if (updateResponse.ok) {
          setUploadProgress(100);
          setUploadStatus('completed');
          toast.success("อัปโหลดและอัพเดตฐานข้อมูลสำเร็จ! วิดีโอพร้อมดูได้แล้ว");
        } else {
          toast.warning("อัปโหลดสำเร็จ แต่ไม่สามารถอัพเดตฐานข้อมูลได้ กรุณาอัพเดต URL ด้วยตนเอง");
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        toast.warning("อัปโหลดสำเร็จ แต่ไม่สามารถอัพเดตฐานข้อมูลได้ กรุณาอัพเดต URL ด้วยตนเอง");
      }
      
      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'กำลังอัปโหลดไฟล์...';
      case 'processing':
        return 'กำลังประมวลผลวิดีโอ (ffmpeg → HLS)';
      case 'completed':
        return 'อัปโหลดและประมวลผลเสร็จสิ้น!';
      case 'error':
        return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      default:
        return 'เลือกไฟล์วิดีโอเพื่อเริ่มอัปโหลด';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <Alert>
        <Upload className="h-4 w-4" />
        <AlertDescription>
          รองรับไฟล์ MP4, WebM, MKV ขนาดสูงสุด 5GB
          <br />
          ระบบจะแปลงเป็น HLS (.m3u8) อัตโนมัติหลังอัปโหลด
        </AlertDescription>
      </Alert>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            เลือกไฟล์วิดีโอ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-file">ไฟล์วิดีโอ</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/mp4,video/webm,video/mkv"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {selectedFile && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>ชื่อไฟล์:</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ขนาด:</span>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ประเภท:</span>
                <span>{selectedFile.type}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {(uploadStatus !== 'idle' || uploadProgress > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              สถานะการอัปโหลด
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getStatusMessage()}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>

            {uploadStatus === 'processing' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  การประมวลผลอาจใช้เวลา 1-5 นาที ขึ้นอยู่กับขนาดไฟล์
                  <br />
                  กรุณาอย่าปิดหน้าเว็บระหว่างประมวลผล
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      <div className="flex gap-4">
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "กำลังอัปโหลด..." : "เริ่มอัปโหลด"}
        </Button>

        {selectedFile && !isUploading && (
          <Button 
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              setUploadStatus('idle');
              setUploadProgress(0);
            }}
          >
            ยกเลิก
          </Button>
        )}
      </div>

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">คำแนะนำการอัปโหลด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>📹 <strong>ไฟล์ที่รองรับ:</strong> MP4, WebM, MKV</p>
          <p>📏 <strong>ขนาดสูงสุด:</strong> 5GB ต่อไฟล์</p>
          <p>🎬 <strong>คุณภาพแนะนำ:</strong> 1080p หรือ 720p</p>
          <p>⚡ <strong>การประมวลผล:</strong> แปลงเป็น HLS อัตโนมัติ</p>
          <p>🔒 <strong>ความปลอดภัย:</strong> ไฟล์จะถูกเก็บใน Cloudflare R2</p>
          <p>📱 <strong>การเล่น:</strong> รองรับทุกอุปกรณ์และเบราว์เซอร์</p>
        </CardContent>
      </Card>
    </div>
  );
}