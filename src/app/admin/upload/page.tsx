import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { upload_jobs, content, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { 
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Film,
  User
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "จัดการการอัพโหลด - แอดมิน",
  description: "ติดตามสถานะการอัพโหลดและประมวลผลไฟล์",
};

async function getUploadJobs() {
  try {
    return await db
      .select({
        job_id: upload_jobs.job_id,
        file_type: upload_jobs.file_type,
        original_filename: upload_jobs.original_filename,
        file_size: upload_jobs.file_size,
        status: upload_jobs.status,
        progress: upload_jobs.progress,
        error_message: upload_jobs.error_message,
        created_at: upload_jobs.created_at,
        updated_at: upload_jobs.updated_at,
        user: {
          id: users.id,
          phone: users.phone,
        },
        content: {
          id: content.id,
          title: content.title,
          type: content.type,
        }
      })
      .from(upload_jobs)
      .leftJoin(users, eq(upload_jobs.user_id, users.id))
      .leftJoin(content, eq(upload_jobs.content_id, content.id))
      .orderBy(desc(upload_jobs.created_at))
      .limit(100);
  } catch (error) {
    console.error('Error fetching upload jobs:', error);
    return [];
  }
}

export default async function UploadManagement() {
  await requireAdmin();
  const uploadJobs = await getUploadJobs();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'processing': return 'bg-blue-500 text-white';
      case 'failed': return 'bg-red-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'uploaded': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'processing': return 'กำลังประมวลผล';
      case 'failed': return 'ล้มเหลว';
      case 'pending': return 'รอดำเนินการ';
      case 'uploaded': return 'อัพโหลดแล้ว';
      default: return status;
    }
  };

  const getFileTypeText = (fileType: string) => {
    switch (fileType) {
      case 'video': return 'วีดีโอ';
      case 'poster': return 'โปสเตอร์';
      case 'avatar': return 'รูปโปรไฟล์';
      default: return fileType;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">จัดการการอัพโหลด</h1>
            <p className="text-muted-foreground">
              ติดตามสถานะการอัพโหลดและประมวลผลไฟล์
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">
                กลับแดชบอร์ด
              </Link>
            </Button>
          </div>
        </div>

        {/* Upload Jobs List */}
        <div className="space-y-4">
          {uploadJobs.map((job) => (
            <Card key={job.job_id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(job.status)}
                      <h3 className="font-semibold text-lg">{job.original_filename}</h3>
                      <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeText(job.file_type)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">ขนาดไฟล์</p>
                        <p className="font-medium">{formatFileSize(job.file_size)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ผู้อัพโหลด</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {job.user?.phone || 'ไม่ทราบ'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">เนื้อหา</p>
                        <p className="font-medium flex items-center gap-1">
                          <Film className="h-3 w-3" />
                          {job.content?.title || 'ไม่ระบุ'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">อัพโหลดเมื่อ</p>
                        <p className="font-medium">
                          {new Date(job.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'processing' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">ความคืบหน้า</span>
                          <span className="text-sm text-muted-foreground">{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="w-full" />
                      </div>
                    )}

                    {/* Error Message */}
                    {job.status === 'failed' && job.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-red-700">
                          <strong>ข้อผิดพลาด:</strong> {job.error_message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Job ID: {job.job_id}</span>
                      <span>
                        อัพเดตล่าสุด: {new Date(job.updated_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {uploadJobs.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่มีการอัพโหลด</h3>
              <p className="text-muted-foreground mb-4">
                ยังไม่มีการอัพโหลดไฟล์ในระบบ
              </p>
              <Button asChild>
                <Link href="/admin/content/new">
                  เพิ่มเนื้อหาใหม่
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}