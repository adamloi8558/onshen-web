import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Crown, Check, Star, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Force dynamic rendering for user state
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "สมาชิก VIP - Ronglakorn",
  description: "สมัครสมาชิก VIP เพียง 39 บาทต่อเดือน ดูหนังและซีรี่ย์พรีเมียมไม่จำกัด",
  openGraph: {
    title: "สมาชิก VIP - Ronglakorn",
    description: "สมัครสมาชิก VIP เพียง 39 บาทต่อเดือน ดูหนังและซีรี่ย์พรีเมียมไม่จำกัด",
    images: ["/og-vip.jpg"],
  },
};

export default async function VIPPage() {
  const user = await getCurrentUser();

  // If already VIP, redirect to profile
  if (user?.is_vip) {
    redirect('/profile');
  }

  const features = [
    {
      icon: <Crown className="h-6 w-6" />,
      title: "เนื้อหาพิเศษ",
      description: "เข้าถึงหนังและซีรี่ย์พรีเมียมที่ใหม่ที่สุด"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "ไม่มีโฆษณา",
      description: "ดูเนื้อหาแบบเต็มอิ่มโดยไม่มีโฆษณารบกวน"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "คุณภาพสูง",
      description: "สตรีมด้วยคุณภาพ HD และ 4K"
    },
    {
      icon: <Check className="h-6 w-6" />,
      title: "ดูไม่จำกัด",
      description: "ดูได้ไม่จำกัดตลอด 24 ชั่วโมง"
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-12 w-12 text-yellow-500 mr-2" />
            <h1 className="text-4xl md:text-6xl font-bold">
              สมาชิก <span className="text-yellow-500">VIP</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            เข้าถึงเนื้อหาพรีเมียมไม่จำกัด ด้วยราคาเพียง 39 บาทต่อเดือน
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700">
                <Crown className="h-5 w-5 mr-2" />
                สมัครสมาชิก VIP
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/auth/login">
                  เข้าสู่ระบบเพื่อสมัคร VIP
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="/popular">
                ดูเนื้อหายอดนิยม
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4 text-yellow-500">
                  {feature.icon}
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-8 w-8 text-yellow-500 mr-2" />
                <CardTitle className="text-2xl">แผน VIP</CardTitle>
              </div>
              <div className="text-4xl font-bold text-yellow-600">
                ฿39
                <span className="text-lg font-normal text-muted-foreground">/เดือน</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">เข้าถึงเนื้อหาพรีเมียมทั้งหมด</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">ไม่มีโฆษณารบกวน</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">คุณภาพ HD และ 4K</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">ดูไม่จำกัดตลอด 24 ชั่วโมง</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">อัปเดตเนื้อหาใหม่ทุกสัปดาห์</span>
                </div>
              </div>
              
              {user ? (
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700">
                  <Crown className="h-4 w-4 mr-2" />
                  สมัครสมาชิก VIP
                </Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/auth/login">
                    เข้าสู่ระบบเพื่อสมัคร
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">คำถามที่พบบ่อย</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">VIP ต่างจากสมาชิกทั่วไปอย่างไร?</h3>
                <p className="text-muted-foreground">
                  สมาชิก VIP สามารถเข้าถึงเนื้อหาพรีเมียมที่ใหม่ที่สุด ดูได้ไม่จำกัด และไม่มีโฆษณารบกวน
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">สามารถยกเลิกได้ไหม?</h3>
                <p className="text-muted-foreground">
                  สามารถยกเลิกได้ทุกเมื่อ โดยจะยังคงใช้งานได้จนถึงวันหมดอายุของรอบการชำระเงิน
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">วิธีการชำระเงิน?</h3>
                <p className="text-muted-foreground">
                  รองรับการชำระเงินผ่านบัตรเครดิต บัตรเดบิต และการโอนเงินผ่านธนาคาร
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}