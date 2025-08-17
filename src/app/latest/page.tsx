import { Metadata } from "next";
import { db, content, categories } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import ContentGrid from "@/components/content-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
    title: "ล่าสุด",
    description: "ดูหนังและซีรี่ย์ใหม่ล่าสุดที่อัปเดตทุกวัน",
};

export default async function LatestPage() {
    try {
        // Get latest movies
        const latestMovies = await db
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
                created_at: content.created_at,
                category: {
                    id: categories.id,
                    name: categories.name,
                    slug: categories.slug,
                }
            })
            .from(content)
            .leftJoin(categories, eq(content.category_id, categories.id))
            .where(and(
                eq(content.status, 'published'),
                eq(content.type, 'movie')
            ))
            .orderBy(desc(content.created_at))
            .limit(24);

        // Get latest series
        const latestSeries = await db
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
                created_at: content.created_at,
                category: {
                    id: categories.id,
                    name: categories.name,
                    slug: categories.slug,
                }
            })
            .from(content)
            .leftJoin(categories, eq(content.category_id, categories.id))
            .where(and(
                eq(content.status, 'published'),
                eq(content.type, 'series')
            ))
            .orderBy(desc(content.created_at))
            .limit(24);

        // Get all latest content (mixed)
        const allLatestContent = await db
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
                created_at: content.created_at,
                category: {
                    id: categories.id,
                    name: categories.name,
                    slug: categories.slug,
                }
            })
            .from(content)
            .leftJoin(categories, eq(content.category_id, categories.id))
            .where(eq(content.status, 'published'))
            .orderBy(desc(content.created_at))
            .limit(36);

        return (
            <div className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">ล่าสุด</h1>
                    <p className="text-muted-foreground">
                        หนังและซีรี่ย์ใหม่ล่าสุดที่อัปเดตทุกวัน
                    </p>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                        <TabsTrigger value="movies">หนัง</TabsTrigger>
                        <TabsTrigger value="series">ซีรี่ย์</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-6">
                        {allLatestContent.length > 0 ? (
                            <ContentGrid
                                content={allLatestContent}
                                showType={true}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">ยังไม่มีเนื้อหาใหม่</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="movies" className="space-y-6">
                        {latestMovies.length > 0 ? (
                            <ContentGrid
                                content={latestMovies}
                                showType={false}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">ยังไม่มีหนังใหม่</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="series" className="space-y-6">
                        {latestSeries.length > 0 ? (
                            <ContentGrid
                                content={latestSeries}
                                showType={false}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">ยังไม่มีซีรี่ย์ใหม่</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        );
    } catch (error) {
        console.error('Latest page error:', error);
        return (
            <div className="container py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">ล่าสุด</h1>
                    <p className="text-muted-foreground mb-4">
                        เกิดข้อผิดพลาดในการโหลดข้อมูล
                    </p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        );
    }
}