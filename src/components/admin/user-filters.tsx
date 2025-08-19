"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface UserFiltersProps {
  initialFilters: {
    search?: string;
    role?: string;
    vip?: string;
  };
}

export function UserFilters({ initialFilters }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(initialFilters.search || "");
  const [role, setRole] = useState(initialFilters.role || "");
  const [vip, setVip] = useState(initialFilters.vip || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (vip) params.set('vip', vip);
    
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setRole("");
    setVip("");
    router.push('/admin/users');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">ค้นหาและกรอง</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเบอร์โทรศัพท์..."
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="บทบาท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ทั้งหมด</SelectItem>
              <SelectItem value="user">ผู้ใช้</SelectItem>
              <SelectItem value="admin">แอดมิน</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={vip} onValueChange={setVip}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="สมาชิก VIP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ทั้งหมด</SelectItem>
              <SelectItem value="true">VIP</SelectItem>
              <SelectItem value="false">ไม่ VIP</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              ค้นหา
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              รีเซ็ต
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}