import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { content, users, upload_jobs, transactions } from "@/lib/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  Film, 
  Upload, 
  Plus,
  Settings,
  Folder,
  Play,
  Eye,
  Coins,
  Calendar,
  CreditCard,
  Activity
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "แดชบอร์ด - จัดการระบบ",
  description: "หน้าแดชบอร์ดสำหรับผู้ดูแลระบบ",
};

async function getDashboardStats() {
  try {
    // Get total users
    const [userCount] = await db
      .select({ count: count() })
      .from(users);

    // Get total content
    const [contentCount] = await db
      .select({ count: count() })
      .from(content);

    // Get published content
    const [publishedCount] = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.status, 'published'));

    // Get VIP users
    const [vipUserCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.is_vip, true));

    // Get total views
    const [totalViews] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${content.views}), 0)` 
      })
      .from(content);

    // Get total saves
    const [totalSaves] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${content.saves}), 0)` 
      })
      .from(content);

    // Get total coins in system
    const [totalCoins] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${users.coins}), 0)` 
      })
      .from(users);

    // Get recent uploads
    const [uploadCount] = await db
      .select({ count: count() })
      .from(upload_jobs);

    // Get processing uploads
    const [processingCount] = await db
      .select({ count: count() })
      .from(upload_jobs)
      .where(eq(upload_jobs.status, 'processing'));

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [newUsersToday] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.created_at} >= ${today}`);

    // Get total revenue (completed transactions)
    const [totalRevenue] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)` 
      })
      .from(transactions)
      .where(eq(transactions.status, 'completed'));

    // Get transactions today
    const [transactionsToday] = await db
      .select({ count: count() })
      .from(transactions)
      .where(sql`${transactions.created_at} >= ${today}`);

    // Get pending transactions
    const [pendingTransactions] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.status, 'pending'));

    return {
      totalUsers: userCount?.count || 0,
      totalContent: contentCount?.count || 0,
      publishedContent: publishedCount?.count || 0,
      vipUsers: vipUserCount?.count || 0,
      totalViews: totalViews?.total || 0,
      totalSaves: totalSaves?.total || 0,
      totalCoins: totalCoins?.total || 0,
      totalUploads: uploadCount?.count || 0,
      processingUploads: processingCount?.count || 0,
      newUsersToday: newUsersToday?.count || 0,
      totalRevenue: totalRevenue?.total || 0,
      transactionsToday: transactionsToday?.count || 0,
      pendingTransactions: pendingTransactions?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      totalContent: 0,
      publishedContent: 0,
      vipUsers: 0,
      totalViews: 0,
      totalSaves: 0,
      totalCoins: 0,
      totalUploads: 0,
      processingUploads: 0,
      newUsersToday: 0,
      totalRevenue: 0,
      transactionsToday: 0,
      pendingTransactions: 0,
    };
  }
}

async function getRecentContent() {
  try {
    return await db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        type: content.type,
        status: content.status,
        views: content.views,
        created_at: content.created_at,
      })
      .from(content)
      .orderBy(desc(content.created_at))
      .limit(5);
  } catch (error) {
    console.error('Error fetching recent content:', error);
    return [];
  }
}

async function getRecentUsers() {
  try {
    return await db
      .select({
        id: users.id,
        phone: users.phone,
        is_vip: users.is_vip,
        coins: users.coins,
        created_at: users.created_at,
        last_login_at: users.last_login_at,
      })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(5);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    return [];
  }
}

async function getRecentUploads() {
  try {
    return await db
      .select({
        job_id: upload_jobs.job_id,
        file_type: upload_jobs.file_type,
        original_filename: upload_jobs.original_filename,
        status: upload_jobs.status,
        progress: upload_jobs.progress,
        created_at: upload_jobs.created_at,
      })
      .from(upload_jobs)
      .orderBy(desc(upload_jobs.created_at))
      .limit(5);
  } catch (error) {
    console.error('Error fetching recent uploads:', error);
    return [];
  }
}

async function getRecentTransactions() {
  try {
    return await db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        payment_ref: transactions.payment_ref,
        created_at: transactions.created_at,
      })
      .from(transactions)
      .orderBy(desc(transactions.created_at))
      .limit(10);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const stats = await getDashboardStats();
  const recentContent = await getRecentContent();
  const recentUsers = await getRecentUsers();
  const recentUploads = await getRecentUploads();
  const recentTransactions = await getRecentTransactions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getContentStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
            <p className="text-muted-foreground">
              ยินดีต้อนรับ, {user.phone} (ผู้ดูแลระบบ)
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/content/new">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มเนื้อหา
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/upload">
                <Upload className="h-4 w-4 mr-2" />
                อัพโหลด
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Row 1 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                VIP: {stats.vipUsers} | วันนี้: +{stats.newUsersToday}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เนื้อหา</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                เผยแพร่: {stats.publishedContent}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยอดชม</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                บันทึก: {stats.totalSaves.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เหรียญในระบบ</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                อัพโหลด: {stats.processingUploads}/{stats.totalUploads}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้ทั้งหมด</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                รายการรอ: {stats.pendingTransactions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายการวันนี้</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transactionsToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                รายการเติมเงิน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กิจกรรมระบบ</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalViews + stats.transactionsToday + stats.newUsersToday).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                กิจกรรมรวมวันนี้
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Button asChild className="h-20 flex-col">
            <Link href="/admin/content">
              <Film className="h-6 w-6 mb-2" />
              <span className="text-sm">จัดการเนื้อหา</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/users">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">จัดการผู้ใช้</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/categories">
              <Folder className="h-6 w-6 mb-2" />
              <span className="text-sm">หมวดหมู่</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/content/new">
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-sm">เพิ่มเนื้อหา</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/api/payment/test">
              <Activity className="h-6 w-6 mb-2" />
              <span className="text-sm">ตรวจสอบระบบ</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/admin/settings">
              <Settings className="h-6 w-6 mb-2" />
              <span className="text-sm">ตั้งค่า</span>
            </Link>
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                เนื้อหาล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContent.length > 0 ? recentContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'movie' ? 'หนัง' : 'ซีรี่ย์'}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${getContentStatusColor(item.status)}`}
                        >
                          {item.status === 'published' ? 'เผยแพร่' : 
                           item.status === 'draft' ? 'ร่าง' : 'เก็บ'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{item.views} ครั้ง</p>
                      <p>{new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่มีเนื้อหา
                  </p>
                )}
              </div>
              {recentContent.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/content">
                      ดูเนื้อหาทั้งหมด
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ผู้ใช้ใหม่ล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length > 0 ? recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {user.is_vip ? (
                          <Badge className="text-xs bg-yellow-500 text-black">
                            VIP
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Member
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {user.coins} เหรียญ
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{new Date(user.created_at).toLocaleDateString('th-TH')}</p>
                      {user.last_login_at && (
                        <p className="text-xs">
                          เข้าล่าสุด: {new Date(user.last_login_at).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่มีผู้ใช้ใหม่
                  </p>
                )}
              </div>
              {recentUsers.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/users">
                      ดูผู้ใช้ทั้งหมด
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                การอัพโหลดล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUploads.length > 0 ? recentUploads.map((upload) => (
                  <div key={upload.job_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium truncate max-w-[200px]">
                        {upload.original_filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {upload.file_type}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${getStatusColor(upload.status)}`}
                        >
                          {upload.status === 'completed' ? 'เสร็จ' :
                           upload.status === 'processing' ? 'ประมวลผล' :
                           upload.status === 'failed' ? 'ล้มเหลว' : 'รอ'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{upload.progress}%</p>
                      <p>{new Date(upload.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่มีการอัพโหลด
                  </p>
                )}
              </div>
              {recentUploads.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/upload">
                      ดูการอัพโหลดทั้งหมด
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                รายการเติมเงินล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">฿{parseFloat(transaction.amount).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {transaction.type}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${
                            transaction.status === 'completed' ? 'bg-green-500' :
                            transaction.status === 'pending' ? 'bg-yellow-500' :
                            transaction.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                          }`}
                        >
                          {transaction.status === 'completed' ? 'สำเร็จ' :
                           transaction.status === 'pending' ? 'รอ' :
                           transaction.status === 'failed' ? 'ล้มเหลว' : transaction.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p className="font-mono text-xs">
                        {transaction.payment_ref?.substring(0, 8)}...
                      </p>
                      <p>{new Date(transaction.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่มีรายการเติมเงิน
                  </p>
                )}
              </div>
              {recentTransactions.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/transactions">
                      ดูรายการทั้งหมด
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                สถานะระบบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Database</div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">ปกติ</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalUsers} users
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Storage (R2)</div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">ปกติ</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalUploads} files
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Payment</div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">ปกติ</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ฿{stats.totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">API</div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">ปกติ</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.transactionsToday} today
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">CDN</div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">ปกติ</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalViews.toLocaleString()} views
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}