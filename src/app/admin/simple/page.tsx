import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  FileVideo, 
  FolderPlus, 
  Upload, 
  Settings,
  Home
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "แอดมิน - Simple Mode",
  description: "แอดมินแบบง่าย",
};

export default async function SimpleAdminPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">แอดมิน - Simple Mode</h1>
            <p className="text-muted-foreground">
              จัดการระบบแบบง่าย (ไม่มี complex components)
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              กลับหน้าแรก
            </Link>
          </Button>
        </div>

        {/* Simple Admin Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* จัดการผู้ใช้ */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                จัดการผู้ใช้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                ดูรายการผู้ใช้ทั้งหมดในระบบ
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm">• ดูรายการผู้ใช้</p>
                <p className="text-sm">• ตรวจสอบสถานะ VIP</p>
                <p className="text-sm">• ดูยอดเงินและเหรียญ</p>
              </div>
              <Button className="w-full" asChild>
                <Link href="/admin/users/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* เพิ่มเนื้อหา */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                เพิ่มเนื้อหา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                เพิ่มหนังและซีรี่ย์ใหม่
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm">• เพิ่มหนังใหม่</p>
                <p className="text-sm">• เพิ่มซีรี่ย์ใหม่</p>
                <p className="text-sm">• จัดการ episodes</p>
              </div>
              <Button className="w-full" asChild>
                <Link href="/admin/content/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* อัพโหลดวีดีโอ */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                อัพโหลดวีดีโอ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                อัพโหลดไฟล์วีดีโอและติดตามความคืบหน้า
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm">• อัพโหลดวีดีโอ</p>
                <p className="text-sm">• ติดตาม progress</p>
                <p className="text-sm">• จัดการไฟล์</p>
              </div>
              <Button className="w-full" asChild>
                <Link href="/admin/upload/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* จัดการหมวดหมู่ */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                จัดการหมวดหมู่
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                จัดการหมวดหมู่เนื้อหา
              </p>
              <div className="space-y-2">
                <p className="text-sm">• เพิ่มหมวดหมู่ใหม่</p>
                <p className="text-sm">• แก้ไขหมวดหมู่</p>
                <p className="text-sm">• ลบหมวดหมู่</p>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/admin/categories">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* ตั้งค่าระบบ */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ตั้งค่าระบบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                ตั้งค่าและคอนฟิกระบบ
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm">• ข้อมูลระบบ</p>
                <p className="text-sm">• การตั้งค่า</p>
                <p className="text-sm">• สถานะเซิร์ฟเวอร์</p>
              </div>
              <Button className="w-full" asChild>
                <Link href="/admin/settings/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/admin">
                  กลับ Admin Dashboard
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href="/api/debug">
                  ตรวจสอบระบบ
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href="/api/debug-env">
                  ตรวจสอบ Environment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>สถานะระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <p className="text-sm text-muted-foreground">Database</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <p className="text-sm text-muted-foreground">Authentication</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <p className="text-sm text-muted-foreground">Turnstile</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <p className="text-sm text-muted-foreground">Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}