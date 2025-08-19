import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db, categories } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/admin/category-form";

export const dynamic = 'force-dynamic';

interface EditCategoryPageProps {
  params: {
    id: string;
  };
}

async function getCategory(id: string) {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function generateMetadata({ params }: EditCategoryPageProps): Promise<Metadata> {
  const category = await getCategory(params.id);
  
  return {
    title: `แก้ไข ${category?.name || 'หมวดหมู่'} - แอดมิน`,
    description: `แก้ไขหมวดหมู่ ${category?.name || ''}`,
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  await requireAdmin();
  
  const category = await getCategory(params.id);
  
  if (!category) {
    notFound();
  }

  return (
    <div className="container py-8">
      <CategoryForm 
        initialData={category}
        isEditing={true}
      />
    </div>
  );
}