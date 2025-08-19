import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  FileVideo, 
  FolderPlus, 
  Upload, 
  Settings,
  Home,
  CheckCircle
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "แอดมิน - Basic Mode",
  description: "แอดมินแบบพื้นฐาน",
};

export default function BasicAdminPage() {
  // No auth check - ultra basic mode

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">แอดมิน - Basic Mode</h1>
            <p className="text-muted-foreground">
              จัดการระบบแบบพื้นฐาน (ไม่ใช้ database หรือ auth)
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              กลับหน้าแรก
            </Link>
          </Button>
        </div>

        {/* System Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>สถานะระบบ MovieFlix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Frontend</div>
                  <div className="text-sm text-muted-foreground">Next.js 14</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-sm text-muted-foreground">PostgreSQL</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Storage</div>
                  <div className="text-sm text-muted-foreground">Cloudflare R2</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Security</div>
                  <div className="text-sm text-muted-foreground">Turnstile</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
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
              <Button className="w-full" asChild>
                <Link href="/admin/content/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                อัพโหลดวีดีโอ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                อัพโหลดไฟล์วีดีโอ
              </p>
              <Button className="w-full" asChild>
                <Link href="/admin/upload/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                จัดการผู้ใช้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                ดูรายการผู้ใช้ทั้งหมด
              </p>
              <Button className="w-full" asChild>
                <Link href="/admin/users/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

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
              <Button className="w-full" asChild>
                <Link href="/admin/categories">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

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
              <Button className="w-full" asChild>
                <Link href="/admin/settings/simple">
                  เข้าจัดการ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Tools */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>เครื่องมือระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/api/debug">
                  ตรวจสอบระบบ
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href="/api/seed-admin">
                  สร้าง Admin User
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href="/api/seed-categories">
                  สร้าง Categories
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Settings className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-900">Basic Mode</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  หน้านี้ไม่ต้องการ authentication และไม่เชื่อมต่อ database โดยตรง
                  <br />
                  เหมาะสำหรับการทดสอบและแก้ไขปัญหา
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}