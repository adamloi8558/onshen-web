import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Upload, FileVideo, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "อัพโหลดวีดีโอ (Simple) - แอดมิน",
  description: "อัพโหลดวีดีโอแบบง่าย",
};

export default async function SimpleUploadPage() {
  await requireAdmin();

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">อัพโหลดวีดีโอ (Simple Mode)</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              อัพโหลดไฟล์วีดีโอ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Upload Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileVideo className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">วิธีการอัพโหลด</h3>
                    <div className="text-sm text-blue-800 mt-1 space-y-1">
                      <p>1. เลือกไฟล์วีดีโอ (MP4, WebM, MKV)</p>
                      <p>2. ระบบจะประมวลผลเป็น HLS อัตโนมัติ</p>
                      <p>3. ติดตามความคืบหน้าในหน้านี้</p>
                    </div>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content_id">Content ID</Label>
                  <Input
                    id="content_id"
                    name="content_id"
                    placeholder="UUID ของเนื้อหาที่ต้องการอัพโหลดวีดีโอ"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    ได้จากการสร้างเนื้อหาในหน้า "เพิ่มเนื้อหา"
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="episode_number">หมายเลขตอน (สำหรับซีรี่ย์)</Label>
                  <Input
                    id="episode_number"
                    name="episode_number"
                    placeholder="เช่น 1.01, 1.2, 2.05 (ถ้าเป็นหนังให้ใส่ 0)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_file">ไฟล์วีดีโอ</Label>
                  <Input
                    id="video_file"
                    name="video_file"
                    type="file"
                    accept="video/mp4,video/webm,video/mkv"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    รองรับ: MP4, WebM, MKV (สูงสุด 100MB)
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-900">Simple Mode</h3>
                      <p className="text-sm text-yellow-800 mt-1">
                        ระบบอัพโหลดแบบง่าย - ยังไม่เชื่อมต่อกับ background processing
                        <br />
                        สำหรับการทดสอบเท่านั้น
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="min-w-[120px]">
                    <Upload className="h-4 w-4 mr-2" />
                    อัพโหลด
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin">
                      ยกเลิก
                    </Link>
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ความคืบหน้าการอัพโหลด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีการอัพโหลด
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}