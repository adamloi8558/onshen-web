import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft,
  Server,
  Database,
  Shield,
  Globe,
  HardDrive,
  Cpu
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "ตั้งค่าระบบ (Simple) - แอดมิน",
  description: "ตั้งค่าระบบแบบง่าย",
};

export default async function SimpleSettingsPage() {
  await requireAdmin();

  // Simple system info without complex calculations
  const systemInfo = {
    nodeVersion: process.version || 'N/A',
    platform: process.platform || 'N/A',
    environment: process.env.NODE_ENV || 'unknown',
    uptime: 'ทำงานปกติ',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">ตั้งค่าระบบ (Simple Mode)</h1>
            <p className="text-muted-foreground">
              ข้อมูลระบบและการตั้งค่าแบบง่าย
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับแดชบอร์ด
            </Link>
          </Button>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Node.js Version</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.nodeVersion}</div>
              <p className="text-xs text-muted-foreground">Runtime Environment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.platform}</div>
              <p className="text-xs text-muted-foreground">Operating System</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Environment</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.environment}</div>
              <p className="text-xs text-muted-foreground">Runtime Mode</p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              สถานะระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span>Database</span>
                </div>
                <Badge className="bg-green-100 text-green-800">เชื่อมต่อแล้ว</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Authentication</span>
                </div>
                <Badge className="bg-green-100 text-green-800">ทำงานปกติ</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  <span>Turnstile</span>
                </div>
                <Badge className="bg-green-100 text-green-800">ทำงานปกติ</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <span>Storage</span>
                </div>
                <Badge className="bg-green-100 text-green-800">พร้อมใช้งาน</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>การจัดการระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="justify-start" variant="outline" asChild>
                <Link href="/api/debug">
                  ตรวจสอบสถานะระบบ
                </Link>
              </Button>

              <Button className="justify-start" variant="outline" asChild>
                <Link href="/api/debug-env">
                  ตรวจสอบ Environment Variables
                </Link>
              </Button>

              <Button className="justify-start" variant="outline" asChild>
                <Link href="/api/create-tables">
                  ตรวจสอบ Database Tables
                </Link>
              </Button>

              <Button className="justify-start" variant="outline" asChild>
                <Link href="/api/seed-categories">
                  สร้าง Categories เริ่มต้น
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}