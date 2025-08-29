"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ContentFiltersProps {
  categories: Category[];
}

export default function ContentFilters({ categories }: ContentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');

  const handleFilter = () => {
    const params = new URLSearchParams();
    
    if (search.trim()) {
      params.set('search', search.trim());
    }
    
    if (type !== 'all') {
      params.set('type', type);
    }
    
    if (status !== 'all') {
      params.set('status', status);
    }
    
    if (category !== 'all') {
      params.set('category', category);
    }

    const queryString = params.toString();
    router.push(`/admin/content${queryString ? `?${queryString}` : ''}`);
  };

  const handleReset = () => {
    setSearch('');
    setType('all');
    setStatus('all');
    setCategory('all');
    router.push('/admin/content');
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="ค้นหาชื่อเรื่อง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilter();
              }
            }}
          />
        </div>
      </div>
      
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทั้งหมด</SelectItem>
          <SelectItem value="movie">หนัง</SelectItem>
          <SelectItem value="series">ซีรี่ย์</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทั้งหมด</SelectItem>
          <SelectItem value="published">เผยแพร่</SelectItem>
          <SelectItem value="draft">ร่าง</SelectItem>
          <SelectItem value="archived">เก็บ</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทั้งหมด</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button onClick={handleFilter}>
        <Search className="h-4 w-4 mr-2" />
        ค้นหา
      </Button>
      
      <Button variant="outline" onClick={handleReset}>
        รีเซ็ต
      </Button>
    </div>
  );
}