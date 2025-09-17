"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Coins, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  phone: string;
  coins: number;
  is_vip: boolean;
  vip_expires_at: Date | null;
}

interface VIPPurchaseButtonProps {
  user: User | null;
}

const VIP_PRICE = 39; // 39 เหรียญ

export default function VIPPurchaseButton({ user }: VIPPurchaseButtonProps) {
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.coins < VIP_PRICE) {
      toast.error(`เหรียญไม่เพียงพอ! ต้องการ ${VIP_PRICE} เหรียญ แต่คุณมี ${user.coins} เหรียญ`);
      router.push('/topup');
      return;
    }

    // Prevent double-click
    if (isPurchasing) return;

    const confirmed = window.confirm(
      `⚠️ ยืนยันการสมัครสมาชิก VIP?\n\n` +
      `💰 ราคา: ${VIP_PRICE} เหรียญ (จาก ${user.coins} เหรียญ)\n` +
      `⏰ ระยะเวลา: 30 วัน\n` +
      `🪙 เหรียญคงเหลือ: ${user.coins - VIP_PRICE} เหรียญ\n\n` +
      `✅ สิทธิประโยชน์:\n` +
      `• เข้าถึงเนื้อหาพรีเมียมทั้งหมด\n` +
      `• ไม่มีโฆษณาขณะดู\n` +
      `• คุณภาพ HD และ 4K\n` +
      `• ดูได้ก่อนใครตลอด 24 ชั่วโมง\n\n` +
      `❗ กดตกลงเพื่อยืนยันการซื้อ`
    );

    if (!confirmed) return;

    try {
      console.log('🔍 VIP Purchase: Starting API call...');
      setIsPurchasing(true);
      
      const response = await fetch('/api/vip/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmed: 'I_CONFIRM_VIP_PURCHASE',
          userCoins: user.coins,
          timestamp: Date.now()
        }),
      });

      console.log('🔍 VIP Purchase: Response status:', response.status);
      console.log('🔍 VIP Purchase: Response ok:', response.ok);

      const data = await response.json();
      console.log('🔍 VIP Purchase: Response data:', data);

      if (response.ok) {
        console.log('✅ VIP Purchase: Success!');
        toast.success(`🎉 ${data.message}`);
        toast.success(`👑 ยินดีต้อนรับสู่สมาชิก VIP!`);
        
        // Redirect to profile to see VIP status
        setTimeout(() => {
          router.push('/profile');
          router.refresh(); // Force refresh to update user state
        }, 2000);
      } else {
        console.log('❌ VIP Purchase: API returned error');
        toast.error(data.error || "เกิดข้อผิดพลาด");
        
        if (data.shortfall) {
          setTimeout(() => {
            if (window.confirm(`ต้องการเติมเหรียญเพิ่ม ${data.shortfall} เหรียญหรือไม่?`)) {
              router.push('/topup');
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('🚨 VIP purchase fetch error:', error);
      toast.error("เกิดข้อผิดพลาดในการสมัครสมาชิก VIP");
    } finally {
      console.log('🔍 VIP Purchase: Cleaning up...');
      setIsPurchasing(false);
    }
  };

  if (!user) {
    return (
      <Button size="lg" className="w-full" onClick={() => router.push('/auth/login')}>
        <Crown className="h-5 w-5 mr-2" />
        เข้าสู่ระบบเพื่อสมัคร VIP
      </Button>
    );
  }

  const hasEnoughCoins = user.coins >= VIP_PRICE;

  return (
    <div className="space-y-4">
      {/* Coins Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              <span className="font-medium">เหรียญของคุณ</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-600">
                {user.coins.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">เหรียญ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insufficient Coins Warning */}
      {!hasEnoughCoins && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            เหรียญไม่เพียงพอสำหรับสมัคร VIP (ต้องการ {VIP_PRICE} เหรียญ)
            <br />
            ขาดอีก {VIP_PRICE - user.coins} เหรียญ
          </AlertDescription>
        </Alert>
      )}

      {/* Purchase Button */}
      {hasEnoughCoins ? (
        <Button 
          size="lg" 
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          <Crown className="h-5 w-5 mr-2" />
          {isPurchasing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              กำลังดำเนินการ...
            </div>
          ) : (
            `สมัครสมาชิก VIP (${VIP_PRICE} เหรียญ)`
          )}
        </Button>
      ) : (
        <Button 
          size="lg" 
          variant="outline" 
          className="w-full"
          onClick={() => router.push('/topup')}
        >
          <Coins className="h-5 w-5 mr-2" />
          เติมเหรียญ ({VIP_PRICE - user.coins} เหรียญ)
        </Button>
      )}

      {/* Purchase Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">สรุปการสมัคร</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>ราคา VIP:</span>
            <span className="font-medium">{VIP_PRICE} เหรียญ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>ระยะเวลา:</span>
            <span className="font-medium">30 วัน</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>เหรียญปัจจุบัน:</span>
            <span className="font-medium">{user.coins} เหรียญ</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span>เหรียญหลังซื้อ:</span>
            <span className={`font-medium ${hasEnoughCoins ? 'text-green-600' : 'text-red-600'}`}>
              {Math.max(0, user.coins - VIP_PRICE)} เหรียญ
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Reminder */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>สิทธิประโยชน์ VIP:</strong>
          <br />
          ✅ เข้าถึงเนื้อหาพรีเมียมทั้งหมด
          <br />
          ✅ ไม่มีโฆษณาขณะดู
          <br />
          ✅ คุณภาพ HD และ 4K
          <br />
          ✅ ดูได้ก่อนใครตลอด 24 ชั่วโมง
        </AlertDescription>
      </Alert>
    </div>
  );
}