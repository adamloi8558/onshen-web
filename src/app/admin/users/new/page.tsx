import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "เพิ่มผู้ใช้ใหม่ - แอดมิน",
  description: "เพิ่มผู้ใช้ใหม่ในระบบ",
};

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">เพิ่มผู้ใช้ใหม่</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลผู้ใช้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                ฟีเจอร์นี้อยู่ระหว่างการพัฒนา
              </p>
              <p className="text-sm text-muted-foreground">
                ผู้ใช้สามารถสมัครสมาชิกเองได้ที่หน้าสมัครสมาชิก
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}