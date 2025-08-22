import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, content, categories, user_saves } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { Bookmark } from "lucide-react";

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "รายการที่บันทึก - Ronglakorn",
  description: "หนังและซีรี่ย์ที่คุณบันทึกไว้",
  openGraph: {
    title: "รายการที่บันทึก - Ronglakorn",
    description: "หนังและซีรี่ย์ที่คุณบันทึกไว้",
  },
};

export default async function SavedPage() {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login?return=/saved');
  }

  // Skip database queries during build with placeholder database
  if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-8">รายการที่บันทึก</h1>
          <div className="text-center py-16">
            <p className="text-muted-foreground">เนื้อหาที่คุณบันทึกไว้</p>
          </div>
        </div>
      </div>
    );
  }

  // Get user's saved content
  const savedContent = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      type: content.type,
      poster_url: content.poster_url,
      content_rating: content.content_rating,
      is_vip_required: content.is_vip_required,
      views: content.views,
      saves: content.saves,
      total_episodes: content.total_episodes,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
      saved_at: user_saves.created_at,
    })
    .from(user_saves)
    .innerJoin(content, eq(user_saves.content_id, content.id))
    .leftJoin(categories, eq(content.category_id, categories.id))
    .where(and(
      eq(user_saves.user_id, user.id),
      eq(content.status, 'published')
    ))
    .orderBy(desc(user_saves.created_at));

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">รายการที่บันทึก</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            หนังและซีรี่ย์ที่คุณบันทึกไว้สำหรับดูภายหลัง
          </p>
        </div>

        {/* Content */}
        {savedContent.length > 0 ? (
          <div>
            <div className="mb-6">
              <p className="text-muted-foreground">
                คุณมี {savedContent.length} เรื่องที่บันทึกไว้
              </p>
            </div>
            <ContentGrid content={savedContent} showType={true} />
          </div>
        ) : (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">ยังไม่มีรายการที่บันทึก</h3>
            <p className="text-muted-foreground mb-6">
              บันทึกหนังหรือซีรี่ย์ที่คุณสนใจไว้เพื่อดูภายหลัง
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/movies"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
              >
                ดูหนัง
              </a>
              <a 
                href="/series"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
              >
                ดูซีรี่ย์
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}