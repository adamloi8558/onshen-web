import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Crown, Calendar, DollarSign } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ (Simple) - แอดมิน",
  description: "จัดการผู้ใช้แบบง่าย",
};

async function getUsers() {
  try {
    return await db
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
      })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(50);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export default async function SimpleUsersPage() {
  await requireAdmin();
  const usersList = await getUsers();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">จัดการผู้ใช้ (Simple Mode)</h1>
            <p className="text-muted-foreground">
              ดูรายการผู้ใช้ทั้งหมด (แบบง่าย)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับแดชบอร์ด
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersList.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สมาชิก VIP</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersList.filter(u => u.is_vip).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">แอดมิน</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersList.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการผู้ใช้ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersList.length > 0 ? (
                usersList.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Image
                        src={user.avatar_url || '/avatars/default.webp'}
                        alt="Avatar"
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.phone}</span>
                          {user.role === 'admin' && (
                            <Badge variant="destructive">แอดมิน</Badge>
                          )}
                          {user.is_vip && (
                            <Badge className="bg-yellow-500">
                              <Crown className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          เข้าร่วมเมื่อ: {new Date(user.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4" />
                        {user.coins} เหรียญ
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ยอดเงิน: ฿{user.balance}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีผู้ใช้ในระบบ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}