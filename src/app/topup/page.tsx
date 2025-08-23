import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, CreditCard, DollarSign, History } from "lucide-react";
import TopupForm from "@/components/topup/topup-form";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "เติมเงิน - Ronglakorn",
  description: "เติมเงินเพื่อซื้อ Coins และสมัครสมาชิก VIP",
};

export default async function TopupPage() {
  let user;
  
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error('Error getting current user:', error);
    redirect("/auth/login");
  }

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen">
      <div className="container space-y-8 py-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold">เติมเงิน</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            เติมเงินเพื่อซื้อ Coins และเพลิดเพลินกับเนื้อหาพิเศษ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Balance */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-600" />
                  ยอดคงเหลือ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-amber-600">
                    {user.coins.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Coins</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ยอดเงิน</span>
                    <span className="font-medium">฿{parseFloat(user.balance).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">สถานะ</span>
                    <span className={`text-sm font-medium ${user.is_vip ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {user.is_vip ? 'VIP' : 'Member'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลการเติมเงิน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span>1 บาท = 1 Coin</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  • Coins ใช้ในการซื้อเนื้อหาพิเศษ
                </div>
                <div className="text-xs text-muted-foreground">
                  • สมาชิก VIP 39 บาท/เดือน
                </div>
                <div className="text-xs text-muted-foreground">
                  • เติมเงินขั้นต่ำ 50 บาท
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topup Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  เติมเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopupForm user={user} />
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  ประวัติการเติมเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>ยังไม่มีประวัติการเติมเงิน</p>
                    <p className="text-sm">เติมเงินครั้งแรกเพื่อดูประวัติ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}