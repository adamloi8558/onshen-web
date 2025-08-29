import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Crown, Coins } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `ประวัติการเงิน - แอดมิน`,
    description: "ดูประวัติการทำธุรกรรมของผู้ใช้",
  };
}

async function getUserWithTransactions(id: string) {
  try {
    // Get user info
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
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return null;

    // Get transactions
    const userTransactions = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        coins: transactions.coins,
        description: transactions.description,
        payment_method: transactions.payment_method,
        payment_reference: transactions.payment_reference,
        processed_at: transactions.processed_at,
        created_at: transactions.created_at,
      })
      .from(transactions)
      .where(eq(transactions.user_id, id))
      .orderBy(desc(transactions.created_at))
      .limit(50);

    return {
      user,
      transactions: userTransactions,
    };
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return null;
  }
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'deposit':
    case 'topup':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'withdraw':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case 'vip_purchase':
      return <Crown className="h-4 w-4 text-yellow-600" />;
    case 'coin_purchase':
      return <Coins className="h-4 w-4 text-amber-600" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
}

function getTransactionTypeName(type: string) {
  switch (type) {
    case 'deposit':
      return 'ฝากเงิน';
    case 'withdraw':
      return 'ถอนเงิน';
    case 'topup':
      return 'เติมเงิน';
    case 'vip_purchase':
      return 'ซื้อ VIP';
    case 'coin_purchase':
      return 'ซื้อเหรียญ';
    default:
      return type;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700">สำเร็จ</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700">รอดำเนินการ</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700">ล้มเหลว</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-700">ยกเลิก</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function UserTransactionsPage({ params }: PageProps) {
  await requireAdmin();

  const data = await getUserWithTransactions(params.id);

  if (!data) {
    notFound();
  }

  const { user, transactions: userTransactions } = data;

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
              <DollarSign className="h-8 w-8" />
              <h1 className="text-4xl font-bold">ประวัติการเงิน</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              ดูประวัติการทำธุรกรรมของ {user.phone}
            </p>
          </div>
        </div>

        {/* User Summary */}
        <Card>
          <CardHeader>
            <CardTitle>สรุปยอด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {user.coins.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">เหรียญ</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ฿{parseFloat(user.balance).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">ยอดเงิน</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {userTransactions.length}
                </div>
                <p className="text-sm text-muted-foreground">ธุรกรรมทั้งหมด</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {user.is_vip ? 'VIP' : 'Member'}
                </div>
                <p className="text-sm text-muted-foreground">สถานะ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>ประวัติธุรกรรม</CardTitle>
          </CardHeader>
          <CardContent>
            {userTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ไม่มีประวัติธุรกรรม</h3>
                <p className="text-muted-foreground">
                  ผู้ใช้รายนี้ยังไม่เคยทำธุรกรรมใดๆ
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getTransactionTypeName(transaction.type)}
                          </span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                        {transaction.payment_reference && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Ref: {transaction.payment_reference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">
                        ฿{parseFloat(transaction.amount).toLocaleString()}
                      </div>
                      {transaction.coins > 0 && (
                        <div className="text-sm text-amber-600">
                          +{transaction.coins} เหรียญ
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}