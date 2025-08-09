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
  BookmarkIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NavbarProps {
  user: {
    id: string;
    phone: string;
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
            <span className="font-bold text-xl">MovieFlix</span>
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

          {/* Right Side Buttons */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10 w-10 rounded-full bg-background/50"
              onClick={() => router.push('/search')}
            >
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <>
                {/* Profile Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 rounded-full bg-background/50"
                    >
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.phone}
                          width={24}
                          height={24}
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
                        <p className="font-medium">{user.phone}</p>
                        <p className="text-xs text-muted-foreground">{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</p>
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
              <>
                {/* Login Button for non-logged users */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 rounded-full bg-background/50"
                  asChild
                >
                  <Link href="/auth/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}

            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full bg-background/50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t bg-background/95 backdrop-blur">
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
                className="block px-4 py-3 text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                หนัง
              </Link>
              <Link
                href="/series"
                className="block px-4 py-3 text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ซีรี่ย์
              </Link>
              <Link
                href="/popular"
                className="block px-4 py-3 text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ยอดนิยม
              </Link>
              <Link
                href="/categories"
                className="block px-4 py-3 text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                หมวดหมู่
              </Link>
              
              {!user && (
                <div className="px-4 pt-4 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block w-full text-center py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full text-center py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}