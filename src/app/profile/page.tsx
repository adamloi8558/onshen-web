import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Force dynamic rendering because we use cookies()
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Coins, User, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "โปรไฟล์",
  description: "จัดการโปรไฟล์และข้อมูลส่วนตัว",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen">
      <div className="container space-y-8 py-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">โปรไฟล์</h1>
          <p className="text-muted-foreground text-lg">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลส่วนตัว
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.phone}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{user.phone}</h3>
                    <p className="text-muted-foreground">สมาชิก {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}</p>
                    {user.is_vip && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">สมาชิก VIP</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">เบอร์โทรศัพท์</label>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                    <p className="font-medium">{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">บทบาท</label>
                    <p className="font-medium">
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">สถานะ VIP</label>
                    <p className="font-medium">
                      {user.is_vip 
                        ? user.vip_expires_at 
                          ? `หมดอายุ ${formatDate(user.vip_expires_at)}`
                          : 'เปิดใช้งาน'
                        : 'ไม่ได้เป็นสมาชิก'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      แก้ไขโปรไฟล์
                    </Link>
                  </Button>
                  {!user.is_vip && (
                    <Button variant="outline" asChild>
                      <Link href="/vip">
                        <Crown className="h-4 w-4 mr-2" />
                        สมัครสมาชิก VIP
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  ยอดเงิน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coins</label>
                  <p className="text-2xl font-bold">{user.coins.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ยอดคงเหลือ</label>
                  <p className="text-2xl font-bold">{formatCurrency(parseFloat(user.balance))}</p>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/topup">
                    เติมเงิน
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {user.is_vip && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Crown className="h-5 w-5" />
                    สมาชิก VIP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">สถานะ</p>
                    <p className="font-medium text-yellow-600">เปิดใช้งาน</p>
                    {user.vip_expires_at && (
                      <>
                        <p className="text-sm text-muted-foreground">วันหมดอายุ</p>
                        <p className="font-medium">{formatDate(user.vip_expires_at)}</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}