"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Crown,
  Coins,
  BookmarkIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NavbarProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    avatar_url: string | null;
    coins: number;
    balance: string;
    is_vip: boolean;
    vip_expires_at: Date | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("ออกจากระบบเรียบร้อยแล้ว");
        router.push("/");
        router.refresh();
      } else {
        toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
      }
    } catch (err) {
      console.error('Logout error:', err);
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold">M</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">MovieFlix</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/movies" className="text-muted-foreground hover:text-foreground transition-colors">
              หนัง
            </Link>
            <Link href="/series" className="text-muted-foreground hover:text-foreground transition-colors">
              ซีรี่ย์
            </Link>
            <Link href="/popular" className="text-muted-foreground hover:text-foreground transition-colors">
              ยอดนิยม
            </Link>
            <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
              หมวดหมู่
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center space-x-2 flex-1 max-w-sm mx-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="ค้นหาหนัง ซีรี่ย์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* VIP Status */}
                {user.is_vip && (
                  <div className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-2 py-1 rounded-full text-xs font-medium">
                    <Crown className="h-3 w-3" />
                    <span>VIP</span>
                  </div>
                )}

                {/* Coins Display */}
                <div className="hidden sm:flex items-center space-x-1 text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm">{user.coins.toLocaleString()}</span>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.is_vip && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Crown className="h-3 w-3" />
                            <span className="text-xs">สมาชิก VIP</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        โปรไฟล์
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/saved" className="cursor-pointer">
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        รายการที่บันทึก
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        ตั้งค่า
                      </Link>
                    </DropdownMenuItem>
                    {!user.is_vip && (
                      <DropdownMenuItem asChild>
                        <Link href="/vip" className="cursor-pointer text-yellow-600">
                          <Crown className="mr-2 h-4 w-4" />
                          สมัครสมาชิก VIP
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            จัดการระบบ
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">สมัครสมาชิก</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <div className="py-4 space-y-2">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="ค้นหาหนัง ซีรี่ย์..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>

              {/* Mobile Navigation Links */}
              <Link
                href="/movies"
                className="block px-4 py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                หนัง
              </Link>
              <Link
                href="/series"
                className="block px-4 py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                ซีรี่ย์
              </Link>
              <Link
                href="/popular"
                className="block px-4 py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                ยอดนิยม
              </Link>
              <Link
                href="/categories"
                className="block px-4 py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                หมวดหมู่
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}