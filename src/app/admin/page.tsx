import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { content, users, upload_jobs } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  Film, 
  Upload, 
  TrendingUp, 
  Plus,
  Settings,
  Folder,
  Play
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "แดชบอร์ด - จัดการระบบ",
  description: "หน้าแดชบอร์ดสำหรับผู้ดูแลระบบ",
};

async function getDashboardStats() {
  try {
    // Get total users
    const [userCount] = await db
      .select({ count: count() })
      .from(users);

    // Get total content
    const [contentCount] = await db
      .select({ count: count() })
      .from(content);

    // Get VIP users
    const [vipUserCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.is_vip, true));

    // Get recent uploads
    const [uploadCount] = await db
      .select({ count: count() })
      .from(upload_jobs);

    // Get processing uploads
    const [processingCount] = await db
      .select({ count: count() })
      .from(upload_jobs)
      .where(eq(upload_jobs.status, 'processing'));

    return {
      totalUsers: userCount?.count || 0,
      totalContent: contentCount?.count || 0,
      vipUsers: vipUserCount?.count || 0,
      totalUploads: uploadCount?.count || 0,
      processingUploads: processingCount?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      totalContent: 0,
      vipUsers: 0,
      totalUploads: 0,
      processingUploads: 0,
    };
  }
}

async function getRecentContent() {
  try {
    return await db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        type: content.type,
        status: content.status,
        views: content.views,
        created_at: content.created_at,
      })
      .from(content)
      .orderBy(desc(content.created_at))
      .limit(5);
  } catch (error) {
    console.error('Error fetching recent content:', error);
    return [];
  }
}

async function getRecentUploads() {
  try {
    return await db
      .select({
        job_id: upload_jobs.job_id,
        file_type: upload_jobs.file_type,
        original_filename: upload_jobs.original_filename,
        status: upload_jobs.status,
        progress: upload_jobs.progress,
        created_at: upload_jobs.created_at,
      })
      .from(upload_jobs)
      .orderBy(desc(upload_jobs.created_at))
      .limit(5);
  } catch (error) {
    console.error('Error fetching recent uploads:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const stats = await getDashboardStats();
  const recentContent = await getRecentContent();
  const recentUploads = await getRecentUploads();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getContentStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
            <p className="text-muted-foreground">
              ยินดีต้อนรับ, {user.phone} (ผู้ดูแลระบบ)
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/content/new">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มเนื้อหา
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/upload">
                <Upload className="h-4 w-4 mr-2" />
                อัพโหลด
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                VIP: {stats.vipUsers} คน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เนื้อหาทั้งหมด</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContent}</div>
              <p className="text-xs text-muted-foreground">
                หนัง และ ซีรี่ย์
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การอัพโหลด</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUploads}</div>
              <p className="text-xs text-muted-foreground">
                กำลังประมวลผล: {stats.processingUploads}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยอดเข้าชม</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                วันนี้
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                เดือนนี้
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-20 flex-col">
            <Link href="/admin/content">
              <Film className="h-6 w-6 mb-2" />
              จัดการเนื้อหา
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/users">
              <Users className="h-6 w-6 mb-2" />
              จัดการผู้ใช้
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/categories">
              <Folder className="h-6 w-6 mb-2" />
              จัดการหมวดหมู่
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/settings">
              <Settings className="h-6 w-6 mb-2" />
              ตั้งค่าระบบ
            </Link>
          </Button>
        </div>

        {/* Recent Content & Uploads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                เนื้อหาล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContent.length > 0 ? recentContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${getContentStatusColor(item.status)}`}
                        >
                          {item.status === 'published' ? 'เผยแพร่' : 
                           item.status === 'draft' ? 'ร่าง' : 'เก็บ'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{item.views} ครั้ง</p>
                      <p>{new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่มีเนื้อหา
                  </p>
                )}
              </div>
              {recentContent.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/content">
                      ดูเนื้อหาทั้งหมด
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                การอัพโหลดล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUploads.length > 0 ? recentUploads.map((upload) => (
                  <div key={upload.job_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium truncate max-w-[200px]">
                        {upload.original_filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {upload.file_type}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${getStatusColor(upload.status)}`}
                        >
                          {upload.status === 'completed' ? 'เสร็จ' :
                           upload.status === 'processing' ? 'ประมวลผล' :
                           upload.status === 'failed' ? 'ล้มเหลว' : 'รอ'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{upload.progress}%</p>
                      <p>{new Date(upload.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่มีการอัพโหลด
                  </p>
                )}
              </div>
              {recentUploads.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/upload">
                      ดูการอัพโหลดทั้งหมด
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}