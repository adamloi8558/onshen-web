"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Upload } from "lucide-react";
import PosterUpload from "./poster-upload";

const contentSchema = z.object({
  title: z.string().min(1, "กรุณาใส่ชื่อเรื่อง"),
  slug: z.string().min(1, "กรุณาใส่ slug"),
  description: z.string().optional(),
  type: z.enum(["movie", "series"], {
    required_error: "กรุณาเลือกประเภท",
  }),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  content_rating: z.enum(["G", "PG", "PG-13", "R", "NC-17"]).default("PG"),
  category_id: z.string().optional(),
  is_vip_required: z.boolean().default(false),
  duration_minutes: z.number().optional(),
  total_episodes: z.number().optional(),
  release_date: z.string().optional(),
  poster_url: z.string().optional(),
  video_url: z.string().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ContentFormProps {
  categories: Category[];
  initialData?: Partial<ContentFormData> & { id?: string };
}

export function ContentForm({ categories, initialData }: ContentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      type: initialData?.type || "movie",
      status: initialData?.status || "draft",
      content_rating: initialData?.content_rating || "PG",
      category_id: initialData?.category_id || "",
      is_vip_required: initialData?.is_vip_required || false,
      duration_minutes: initialData?.duration_minutes,
      total_episodes: initialData?.total_episodes,
      release_date: initialData?.release_date || "",
      poster_url: initialData?.poster_url || "",
      video_url: initialData?.video_url || "",
    },
  });

  const watchedType = form.watch("type");

  // Auto-generate slug when title changes
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  // Update slug when title changes (only if slug is empty or matches old title)
  const handleTitleChange = (title: string) => {
    const currentSlug = form.getValues("slug");
    if (!currentSlug || currentSlug === generateSlug(form.getValues("title"))) {
      form.setValue("slug", generateSlug(title));
    }
  };

  const onSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);
    
    try {
      const url = initialData?.id ? `/api/admin/content/${initialData.id}` : '/api/admin/content';
      const method = initialData?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id === "" ? null : data.category_id,
          duration_minutes: data.duration_minutes || null,
          total_episodes: data.total_episodes || null,
          release_date: data.release_date === "" ? null : data.release_date,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        
        if (error.details && Array.isArray(error.details)) {
          // Show validation errors
          error.details.forEach((detail: { field: string; message: string }) => {
            toast.error(`${detail.field}: ${detail.message}`);
          });
        } else {
          toast.error(error.error || 'เกิดข้อผิดพลาด');
        }
        return;
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      toast.success(initialData?.id ? 'อัปเดตเนื้อหาสำเร็จ' : 'เพิ่มเนื้อหาสำเร็จ');
      
      // Redirect to content list or edit page
      if (initialData?.id) {
        router.refresh();
      } else {
        // Redirect to content list instead of edit page
        router.push('/admin/content');
      }
      
    } catch (error) {
      console.error('Content form error:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin/content">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Link>
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                "กำลังบันทึก..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  บันทึก
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Poster Upload */}
          <div className="lg:col-span-1">
            <PosterUpload 
              currentPosterUrl={form.watch("poster_url")}
              onPosterChange={(url) => form.setValue("poster_url", url)}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลหลัก</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อเรื่อง *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="กรอกชื่อเรื่อง"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleTitleChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="auto-generated-from-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>คำอธิบาย</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="กรอกคำอธิบายเนื้อหา"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Type-specific fields */}
            {watchedType === "movie" && (
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลหนัง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ความยาว (นาที)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="120"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {watchedType === "series" && (
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลซีรี่ย์</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="total_episodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>จำนวนตอนทั้งหมด</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การเผยแพร่</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานะ</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">ร่าง</SelectItem>
                          <SelectItem value="published">เผยแพร่</SelectItem>
                          <SelectItem value="archived">เก็บ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_vip_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">เนื้อหา VIP</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          ต้องเป็นสมาชิก VIP ถึงจะดูได้
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ประเภทและหมวดหมู่</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประเภท *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="movie">หนัง</SelectItem>
                          <SelectItem value="series">ซีรี่ย์</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เรทติ้ง</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกเรทติ้ง" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="G">G - ดูได้ทุกวัย</SelectItem>
                          <SelectItem value="PG">PG - ควรมีผู้ปกครอง</SelectItem>
                          <SelectItem value="PG-13">PG-13 - 13 ปีขึ้นไป</SelectItem>
                          <SelectItem value="R">R - 17 ปีขึ้นไป</SelectItem>
                          <SelectItem value="NC-17">NC-17 - 18 ปีขึ้นไป</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมวดหมู่</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกหมวดหมู่" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">ไม่มีหมวดหมู่</SelectItem>
                          {Array.isArray(categories) && categories.length > 0 && categories.map((category) => (
                            <SelectItem key={category.id} value={category.id || ""}>
                              {category.name || "ไม่มีชื่อ"}
                            </SelectItem>
                          ))}
                          {(!Array.isArray(categories) || categories.length === 0) && (
                            <SelectItem value="loading" disabled>
                              กำลังโหลดหมวดหมู่...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="release_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันที่เผยแพร่</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="poster_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL ภาพปก</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/poster.jpg"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        ใส่ URL ภาพปก หรืออัปโหลดภาพผ่านระบบ
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL วิดีโอ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://pub-b24c104618264932a27b9455988b0fae.r2.dev/uploads/videos/..."
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        ใส่ URL วิดีโอที่อัปโหลดแล้ว หรือจะอัปโหลดใหม่ในหน้าอัปโหลด
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>มีเดีย</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  หลังจากบันทึกเนื้อหาแล้ว จะสามารถอัพโหลดรูปภาพและวีดีโอได้
                </div>
                {initialData?.id && (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/content/${initialData.id}/upload`}>
                        <Upload className="h-4 w-4 mr-2" />
                        จัดการมีเดีย
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}