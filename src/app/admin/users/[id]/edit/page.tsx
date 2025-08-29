import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import UserEditForm from "@/components/admin/user-edit-form";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `แก้ไขผู้ใช้ - แอดมิน`,
    description: "แก้ไขข้อมูลผู้ใช้และจัดการสิทธิ์",
  };
}

async function getUser(id: string) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        phone: users.phone,
        avatar_url: users.avatar_url,
        role: users.role,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
        last_login_at: users.last_login_at,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function EditUserPage({ params }: PageProps) {
  await requireAdmin();

  const user = await getUser(params.id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <div className="container space-y-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8" />
              <h1 className="text-4xl font-bold">แก้ไขผู้ใช้</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              จัดการข้อมูลและสิทธิ์ของผู้ใช้ {user.phone}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลผู้ใช้</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <Image 
                        src={user.avatar_url} 
                        alt="Avatar" 
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">สร้างเมื่อ:</span>
                    <span>{new Date(user.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">อัพเดตล่าสุด:</span>
                    <span>{new Date(user.updated_at).toLocaleDateString('th-TH')}</span>
                  </div>
                  {user.last_login_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">เข้าสู่ระบบล่าสุด:</span>
                      <span>{new Date(user.last_login_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>แก้ไขข้อมูล</CardTitle>
              </CardHeader>
              <CardContent>
                <UserEditForm user={user} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}