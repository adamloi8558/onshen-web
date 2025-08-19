import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "เพิ่มหมวดหมู่ใหม่ - แอดมิน",
  description: "เพิ่มหมวดหมู่เนื้อหาใหม่",
};

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin/categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">เพิ่มหมวดหมู่ใหม่</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อหมวดหมู่</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="เช่น บู๊, ตลก, หลอน"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="เช่น action, comedy, horror"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  ใช้สำหรับ URL เช่น /categories/action
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="คำอธิบายเกี่ยวกับหมวดหมู่นี้"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="min-w-[120px]">
                  <Save className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/categories">
                    ยกเลิก
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}