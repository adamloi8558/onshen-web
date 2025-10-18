import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Settings,
  Database,
  Server,
  Cpu,
  HardDrive,
  Shield,
  Key,
  Globe
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "ตั้งค่าระบบ - แอดมิน",
  description: "ตั้งค่าและคอนฟิกระบบ",
};

async function getSystemInfo() {
  try {
    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
    };

    return systemInfo;
  } catch (error) {
    console.error('Error getting system info:', error);
    return null;
  }
}

export default async function SettingsPage() {
  await requireAdmin();
  
  let systemInfo;
  try {
    systemInfo = await getSystemInfo();
  } catch (error) {
    console.error('Error in SettingsPage:', error);
    systemInfo = null;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} วัน ${hours} ชั่วโมง`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  };

  const formatBytes = (bytes: number) => {
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
            <h1 className="text-3xl font-bold">ตั้งค่าระบบ</h1>
            <p className="text-muted-foreground">
              ตั้งค่าและคอนฟิกระบบ
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">
              กลับแดชบอร์ด
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                ข้อมูลระบบ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Node.js Version:</span>
                    <span className="font-medium">{systemInfo.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="font-medium">{systemInfo.platform} ({systemInfo.arch})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment:</span>
                    <Badge variant={systemInfo.environment === 'production' ? 'default' : 'secondary'}>
                      {systemInfo.environment}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">{formatUptime(systemInfo.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory Used:</span>
                    <span className="font-medium">{formatBytes(systemInfo.memory.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory Total:</span>
                    <span className="font-medium">{formatBytes(systemInfo.memory.heapTotal)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                ฐานข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className="bg-green-500 text-white">เชื่อมต่อแล้ว</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">PostgreSQL</span>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  ตรวจสอบการเชื่อมต่อ
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/api/debug">
                    <Globe className="h-4 w-4 mr-2" />
                    Debug Info
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                การจัดเก็บ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage Type:</span>
                <span className="font-medium">Cloudflare R2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className="bg-green-500 text-white">เชื่อมต่อแล้ว</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bucket:</span>
                <span className="font-medium">movieflix</span>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <HardDrive className="h-4 w-4 mr-2" />
                  ตรวจสอบ Storage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Background Workers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Background Workers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Task Service:</span>
                <Badge className="bg-green-500 text-white">ทำงาน</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redis Queue:</span>
                <Badge className="bg-green-500 text-white">เชื่อมต่อแล้ว</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Video Processing:</span>
                <Badge className="bg-green-500 text-white">พร้อมใช้งาน</Badge>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/admin/upload">
                    <Cpu className="h-4 w-4 mr-2" />
                    ดู Jobs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ความปลอดภัย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">JWT Auth:</span>
                <Badge className="bg-green-500 text-white">เปิดใช้งาน</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate Limiting:</span>
                <Badge className="bg-green-500 text-white">เปิดใช้งาน</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Turnstile:</span>
                <Badge className="bg-green-500 text-white">เปิดใช้งาน</Badge>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  จัดการ API Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                การตั้งค่าแอปพลิเคชัน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">VIP Price:</span>
                <span className="font-medium">39 บาท/เดือน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coin Rate:</span>
                <span className="font-medium">1 บาท = 1 เหรียญ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max File Size:</span>
                <span className="font-medium">100MB</span>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  แก้ไขการตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>การดำเนินการด่วน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" asChild>
                <Link href="/api/create-tables">
                  <Database className="h-4 w-4 mr-2" />
                  สร้าง Tables
                </Link>
              </Button>
              <form action="/api/health" method="GET">
                <Button variant="outline" type="submit">
                  <Server className="h-4 w-4 mr-2" />
                  Health Check
                </Button>
              </form>
              <Button variant="outline" asChild>
                <Link href="/admin/content">
                  <Settings className="h-4 w-4 mr-2" />
                  จัดการเนื้อหา
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  <Settings className="h-4 w-4 mr-2" />
                  จัดการผู้ใช้
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}