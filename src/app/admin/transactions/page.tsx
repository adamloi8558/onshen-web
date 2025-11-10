import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db, transactions } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "ประวัติการเงินทั้งหมด - จัดการระบบ",
  description: "ดูประวัติการทำธุรกรรมทั้งหมดในระบบ",
};

async function getAllTransactions() {
  try {
    return await db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        description: transactions.description,
        payment_ref: transactions.payment_ref,
        created_at: transactions.created_at,
      })
      .from(transactions)
      .orderBy(desc(transactions.created_at))
      .limit(100);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          สำเร็จ
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          รอชำระ
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          ล้มเหลว
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'topup':
      return 'text-green-600';
    case 'vip_purchase':
      return 'text-yellow-600';
    case 'withdrawal':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

export default async function AllTransactionsPage() {
  await requireAdmin();
  const allTransactions = await getAllTransactions();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-8 w-8" />
            <h1 className="text-3xl font-bold">ประวัติการเงินทั้งหมด</h1>
          </div>
          <p className="text-muted-foreground">
            รายการธุรกรรมทั้งหมดในระบบ (ล่าสุด 100 รายการ)
          </p>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>รายการธุรกรรม</CardTitle>
          </CardHeader>
          <CardContent>
            {allTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ไม่มีรายการธุรกรรม</h3>
                <p className="text-muted-foreground">
                  ยังไม่มีการทำธุรกรรมใดๆ ในระบบ
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {transaction.type === 'topup' ? 'เติมเหรียญ' : 
                           transaction.type === 'vip_purchase' ? 'ซื้อ VIP' : 
                           transaction.description || transaction.type}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                      {transaction.payment_ref && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Ref: {transaction.payment_ref}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(transaction.created_at).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'topup' ? '+' : transaction.type === 'vip_purchase' ? '-' : ''}
                        ฿{parseFloat(transaction.amount).toLocaleString()}
                      </div>
                      {transaction.type === 'topup' && transaction.status === 'completed' && (
                        <div className="text-sm text-amber-600">
                          +{parseFloat(transaction.amount)} เหรียญ
                        </div>
                      )}
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




