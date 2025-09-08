import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Lock, Bell } from "lucide-react";
import Link from "next/link";
import ProfileForm from "@/components/settings/profile-form";
import ChangePasswordForm from "@/components/settings/change-password-form";
import VIPMembershipCard from "@/components/vip-membership-card";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "ตั้งค่า - Ronglakorn",
  description: "จัดการการตั้งค่าบัญชีและความปลอดภัย",
};

export default async function SettingsPage() {
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
            <Settings className="h-8 w-8" />
            <h1 className="text-4xl font-bold">ตั้งค่า</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            จัดการข้อมูลส่วนตัว ความปลอดภัย และการตั้งค่าบัญชี
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">หมวดหมู่</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Link 
                    href="#profile" 
                    className="flex items-center gap-3 px-6 py-3 text-sm hover:bg-muted transition-colors border-r-2 border-primary"
                  >
                    <User className="h-4 w-4" />
                    ข้อมูลส่วนตัว
                  </Link>
                  <Link 
                    href="#security" 
                    className="flex items-center gap-3 px-6 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    ความปลอดภัย
                  </Link>
                  <Link 
                    href="#notifications" 
                    className="flex items-center gap-3 px-6 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    การแจ้งเตือน
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right content */}
          <div className="lg:col-span-2 space-y-8">
            {/* VIP Membership Card */}
            <VIPMembershipCard user={user} />

            {/* Profile Settings */}
            <Card id="profile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลส่วนตัว
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card id="security">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  ความปลอดภัย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ChangePasswordForm />

                <Separator />

                {/* Account Activity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">กิจกรรมบัญชี</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">เข้าสู่ระบบล่าสุด</p>
                        <p className="text-sm text-muted-foreground">
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleString('th-TH')
                            : 'ไม่มีข้อมูล'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">สร้างบัญชีเมื่อ</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card id="notifications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  การแจ้งเตือน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">เนื้อหาใหม่</h4>
                      <p className="text-sm text-muted-foreground">
                        แจ้งเตือนเมื่อมีหนังหรือซีรี่ย์ใหม่
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      เปิด
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">VIP หมดอายุ</h4>
                      <p className="text-sm text-muted-foreground">
                        แจ้งเตือนก่อนสมาชิก VIP หมดอายุ
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      เปิด
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">ตอนใหม่</h4>
                      <p className="text-sm text-muted-foreground">
                        แจ้งเตือนเมื่อซีรี่ย์ที่บันทึกไว้มีตอนใหม่
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      เปิด
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    บันทึกการตั้งค่า
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">ขั้นตอนที่อันตราย</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium text-red-600">ลบบัญชี</h4>
                    <p className="text-sm text-muted-foreground">
                      ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    ลบบัญชี
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}