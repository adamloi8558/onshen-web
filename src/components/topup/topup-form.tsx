"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Wallet, QrCode, Coins, Check } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  phone: string;
  coins: number;
  balance: string;
}

interface TopupFormProps {
  user: User;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function TopupForm({ }: TopupFormProps) {
  const [amount, setAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'credit' | 'wallet' | 'qr'>('credit');

  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < 50) {
      toast.error("จำนวนเงินขั้นต่ำ 50 บาท");
      return;
    }

    if (amount > 50000) {
      toast.error("จำนวนเงินสูงสุด 50,000 บาท");
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          method: selectedMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`เติมเงินสำเร็จ! ได้รับ ${amount} Coins`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error('Topup error:', error);
      toast.error("เกิดข้อผิดพลาดในการเติมเงิน");
    } finally {
      setIsLoading(false);
    }
  };

  const coinsToReceive = amount;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Input */}
      <div className="space-y-3">
        <Label htmlFor="amount" className="text-base font-medium">
          จำนวนเงิน (บาท)
        </Label>
        <Input
          id="amount"
          type="number"
          min="50"
          max="50000"
          step="1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="text-lg h-12"
          placeholder="ใส่จำนวนเงิน"
        />
        <p className="text-xs text-muted-foreground">
          ขั้นต่ำ 50 บาท - สูงสุด 50,000 บาท
        </p>
      </div>

      {/* Quick Amounts */}
      <div className="space-y-3">
        <Label className="text-base font-medium">จำนวนยอดนิยม</Label>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <Button
              key={value}
              type="button"
              variant={amount === value ? "default" : "outline"}
              onClick={() => handleQuickAmount(value)}
              className="h-10"
            >
              ฿{value.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Payment Methods */}
      <div className="space-y-3">
        <Label className="text-base font-medium">วิธีการชำระเงิน</Label>
        <div className="grid grid-cols-1 gap-2">
          <Card
            className={`cursor-pointer transition-all ${
              selectedMethod === 'credit' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedMethod('credit')}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <CreditCard className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">บัตรเครดิต/เดบิต</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
              </div>
              {selectedMethod === 'credit' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedMethod === 'wallet' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedMethod('wallet')}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Wallet className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">ví điện tử</p>
                <p className="text-sm text-muted-foreground">TrueMoney, PromptPay</p>
              </div>
              {selectedMethod === 'wallet' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedMethod === 'qr' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedMethod('qr')}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <QrCode className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">QR Code</p>
                <p className="text-sm text-muted-foreground">สแกน QR เพื่อชำระ</p>
              </div>
              {selectedMethod === 'qr' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium">สรุปการเติมเงิน</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>จำนวนเงิน:</span>
            <span>฿{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ค่าธรรมเนียม:</span>
            <span className="text-green-600">ฟรี</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Coins ที่จะได้รับ:</span>
            <span className="flex items-center gap-1 text-amber-600">
              <Coins className="h-4 w-4" />
              {coinsToReceive.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full h-12 text-lg"
        disabled={isLoading || amount < 50}
      >
        {isLoading ? "กำลังดำเนินการ..." : `เติมเงิน ฿${amount.toLocaleString()}`}
      </Button>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>🔒 การเติมเงินปลอดภัยด้วยการเข้ารหัส SSL</p>
        <p>💰 Coins จะเข้าบัญชีทันทีหลังชำระเงิน</p>
        <p>📞 หากมีปัญหา ติดต่อเจ้าหน้าที่ 24/7</p>
      </div>
    </form>
  );
}