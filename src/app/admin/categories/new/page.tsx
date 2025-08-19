import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import CategoryForm from "@/components/admin/category-form";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "เพิ่มหมวดหมู่ใหม่ - แอดมิน",
  description: "เพิ่มหมวดหมู่เนื้อหาใหม่",
};

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="container py-8">
      <CategoryForm />
    </div>
  );
}