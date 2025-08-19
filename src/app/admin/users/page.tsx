import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, like, eq, and } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { UserFilters } from "@/components/admin/user-filters";
import Link from "next/link";
import Image from "next/image";
import { 
  User,
  Crown,
  Edit3,
  Plus,
  Calendar,
  DollarSign
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ - แอดมิน",
  description: "จัดการผู้ใช้ สมาชิก VIP และบัญชีผู้ใช้",
};

interface UserFilters {
  search?: string;
  role?: string;
  vip?: string;
}

async function getUsers(filters: UserFilters = {}) {
  try {
    // Build base query
    const baseQuery = db
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
      .from(users);

    // Apply filters
    const whereConditions = [];

    if (filters.search && filters.search.trim() !== "") {
      whereConditions.push(like(users.phone, `%${filters.search}%`));
    }

    if (filters.role && filters.role !== "all" && (filters.role === 'user' || filters.role === 'admin')) {
      whereConditions.push(eq(users.role, filters.role));
    }

    if (filters.vip && filters.vip !== "all") {
      if (filters.vip === 'true') {
        whereConditions.push(eq(users.is_vip, true));
      } else if (filters.vip === 'false') {
        whereConditions.push(eq(users.is_vip, false));
      }
    }

    // Execute query with or without filters
    if (whereConditions.length > 0) {
      return await baseQuery
        .where(and(...whereConditions)!)
        .orderBy(desc(users.created_at))
        .limit(100);
    } else {
      return await baseQuery
        .orderBy(desc(users.created_at))
        .limit(100);
    }

  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

interface UsersPageProps {
  searchParams: {
    search?: string;
    role?: string;
    vip?: string;
  };
}

export default async function UsersManagement({ searchParams }: UsersPageProps) {
  await requireAdmin();
  
  const filters: UserFilters = {
    search: searchParams.search || "",
    role: searchParams.role || "all",
    vip: searchParams.vip || "all",
  };

  const usersList = await getUsers(filters);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      case 'user': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'แอดมิน';
      case 'user': return 'ผู้ใช้';
      default: return role;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'ไม่เคย';
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBalance = (balance: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(parseFloat(balance));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
            <p className="text-muted-foreground">
              จัดการผู้ใช้ สมาชิก VIP และบัญชีผู้ใช้
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/users/new">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มผู้ใช้
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">
                กลับแดชบอร์ด
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <UserFilters initialFilters={filters} />

        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {usersList.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.phone}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {user.is_vip && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{user.phone}</h3>
                    <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      เหรียญ
                    </span>
                    <span className="font-medium">{user.coins.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ยอดเงิน
                    </span>
                    <span className="font-medium">{formatBalance(user.balance)}</span>
                  </div>

                  {user.is_vip && user.vip_expires_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        VIP หมดอายุ
                      </span>
                      <span className="font-medium text-yellow-600">
                        {formatDate(user.vip_expires_at)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      เข้าสู่ระบบ
                    </span>
                    <span className="font-medium">
                      {formatDate(user.last_login_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      สมัครเมื่อ
                    </span>
                    <span className="font-medium">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/users/${user.id}/edit`}>
                      <Edit3 className="h-3 w-3 mr-1" />
                      แก้ไข
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/users/${user.id}/transactions`}>
                      <DollarSign className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {usersList.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบผู้ใช้</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.role || filters.vip
                  ? "ไม่พบผู้ใช้ที่ตรงตามเงื่อนไขการค้นหา"
                  : "ยังไม่มีผู้ใช้ในระบบ"
                }
              </p>
              <Button asChild>
                <Link href="/admin/users/new">
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มผู้ใช้แรก
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}