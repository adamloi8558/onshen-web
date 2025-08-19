import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Save, FileVideo } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "เพิ่มเนื้อหา (Simple) - แอดมิน",
  description: "เพิ่มเนื้อหาแบบง่าย",
};

export default async function SimpleContentPage() {
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
          <h1 className="text-3xl font-bold">เพิ่มเนื้อหา (Simple Mode)</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              ข้อมูลเนื้อหา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">ชื่อเรื่อง</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="เช่น Avengers: Endgame"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="เช่น avengers-endgame"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  ใช้สำหรับ URL เช่น /movies/avengers-endgame
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="เรื่องย่อของเนื้อหา"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">ประเภท</Label>
                <select 
                  id="type" 
                  name="type" 
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">เลือกประเภท</option>
                  <option value="movie">หนัง</option>
                  <option value="series">ซีรี่ย์</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">สถานะ</Label>
                <select 
                  id="status" 
                  name="status" 
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="draft">ร่าง</option>
                  <option value="published">เผยแพร่</option>
                  <option value="archived">เก็บ</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poster_url">URL รูปโปสเตอร์</Label>
                <Input
                  id="poster_url"
                  name="poster_url"
                  placeholder="https://example.com/poster.jpg"
                  type="url"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>หมายเหตุ:</strong> นี่คือ Simple Mode ที่ไม่ใช้ complex components
                  <br />
                  หลังจากสร้างเนื้อหาแล้ว ให้ไปหน้าอัพโหลดเพื่ออัพโหลดวีดีโอ
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="min-w-[120px]">
                  <Save className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin">
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