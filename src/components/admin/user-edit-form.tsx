"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Coins, DollarSign, Shield, Save } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  phone: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  coins: number;
  balance: string;
  is_vip: boolean;
  vip_expires_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface UserEditFormProps {
  user: User;
}

export default function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: user.role,
    coins: user.coins,
    balance: parseFloat(user.balance),
    is_vip: user.is_vip,
    vip_expires_at: user.vip_expires_at 
      ? new Date(user.vip_expires_at).toISOString().split('T')[0] 
      : '',
  });

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          coins: formData.coins,
          balance: formData.balance,
          is_vip: formData.is_vip,
          vip_expires_at: formData.vip_expires_at || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("อัพเดตข้อมูลผู้ใช้สำเร็จ");
        // Refresh first, then redirect after a short delay
        router.refresh();
        setTimeout(() => {
          router.push('/admin/users');
        }, 500);
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error("เกิดข้อผิดพลาดในการอัพเดตข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCoins = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      coins: prev.coins + amount
    }));
  };

  const handleAddBalance = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      balance: prev.balance + amount
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Management */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          บทบาท
        </Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => handleInputChange('role', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
            <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* VIP Management */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-600" />
          สมาชิก VIP
        </Label>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="is_vip"
            checked={formData.is_vip}
            onCheckedChange={(checked) => handleInputChange('is_vip', checked)}
          />
          <Label htmlFor="is_vip">เป็นสมาชิก VIP</Label>
        </div>

        {formData.is_vip && (
          <div className="space-y-2">
            <Label htmlFor="vip_expires">วันหมดอายุ VIP</Label>
            <Input
              id="vip_expires"
              type="date"
              value={formData.vip_expires_at}
              onChange={(e) => handleInputChange('vip_expires_at', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              หากไม่ระบุ จะถือว่าไม่มีวันหมดอายุ
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Coins Management */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-600" />
          เหรียญ
        </Label>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={formData.coins}
            onChange={(e) => handleInputChange('coins', parseInt(e.target.value) || 0)}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handleAddCoins(100)}
            >
              +100
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handleAddCoins(500)}
            >
              +500
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handleAddCoins(1000)}
            >
              +1000
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Balance Management */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          ยอดเงิน (บาท)
        </Label>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.balance}
            onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handleAddBalance(100)}
            >
              +100
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handleAddBalance(500)}
            >
              +500
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handleAddBalance(1000)}
            >
              +1000
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">สรุปการเปลี่ยนแปลง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">บทบาท:</span>
              <p className="font-medium">
                {formData.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">สมาชิก VIP:</span>
              <p className="font-medium">
                {formData.is_vip ? 'ใช่' : 'ไม่ใช่'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">เหรียญ:</span>
              <p className="font-medium text-amber-600">
                {formData.coins.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">ยอดเงิน:</span>
              <p className="font-medium text-green-600">
                ฿{formData.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push('/admin/users')}
          disabled={isLoading}
        >
          ยกเลิก
        </Button>
      </div>

      {/* Warning */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <p>⚠️ การเปลี่ยนแปลงข้อมูลผู้ใช้จะมีผลทันที</p>
        <p>🔒 การเปลี่ยนบทบาทเป็นแอดมินต้องใช้ความระมัดระวัง</p>
        <p>💰 การเพิ่มเหรียญและยอดเงินจะไม่มีการบันทึกประวัติ</p>
      </div>
    </form>
  );
}