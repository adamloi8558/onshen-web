import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { ContentForm } from "@/components/admin/content-form";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "เพิ่มเนื้อหาใหม่ - แอดมิน",
  description: "เพิ่มหนัง ซีรี่ย์ หรือเนื้อหาใหม่",
};

async function getCategories() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(categories.name);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function NewContentPage() {
  await requireAdmin();
  const categoriesList = await getCategories();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">เพิ่มเนื้อหาใหม่</h1>
            <p className="text-muted-foreground">
              เพิ่มหนัง ซีรี่ย์ หรือเนื้อหาใหม่เข้าสู่ระบบ
            </p>
          </div>

          <ContentForm categories={categoriesList} />
        </div>
      </div>
    </div>
  );
}