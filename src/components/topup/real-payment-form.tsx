"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, QrCode, Clock, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import QRCodeDisplay from "./qr-code-display";

interface PaymentFormProps {
  userCoins: number;
}

interface PaymentState {
  amount: number;
  qrCode: string;
  ref: string;
  status: 'idle' | 'creating' | 'pending' | 'checking' | 'completed' | 'expired' | 'error';
  transactionId?: string;
}

export default function RealPaymentForm({ userCoins }: PaymentFormProps) {
  const [payment, setPayment] = useState<PaymentState>({
    amount: 0,
    qrCode: '',
    ref: '',
    status: 'idle',
  });
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);

  // Debug state changes
  useEffect(() => {
    console.log('Payment state changed:', payment);
  }, [payment]);

  useEffect(() => {
    console.log('showQRCode state changed:', showQRCode);
  }, [showQRCode]);

  const presetAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleCreatePayment = async () => {
    if (!selectedAmount || selectedAmount < 1) {
      toast.error('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      setPayment(prev => ({ ...prev, status: 'creating' }));

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedAmount,
          type: 'qrcode_tg'
        }),
      });

      const data = await response.json();
      console.log('Payment API response:', data);

      if (response.ok) {
        // Debug the received data
        console.log('QR Code received:', data.qrcode);
        console.log('QR Code length:', data.qrcode?.length);
        
        // Set payment data first (don't wait for link)
        const paymentData = {
          amount: selectedAmount,
          qrCode: data.qrcode,
          ref: data.ref,
          status: 'pending' as const,
        };
        console.log('Setting payment data:', paymentData);
        setPayment(paymentData);
        console.log('Setting showQRCode to true');
        
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          setShowQRCode(true);
          console.log('showQRCode set to true via setTimeout');
        }, 100);
        toast.success('สร้างรายการชำระเงินสำเร็จ!');
        
        // Link payment to user (async, don't block UI)
        fetch('/api/payment/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: data.ref,
            amount: selectedAmount,
          }),
        }).catch(error => {
          console.error('Link payment error (non-blocking):', error);
        });
        
        // Start checking payment status
        startPaymentStatusCheck(data.ref);
      } else {
        throw new Error(data.error || 'ไม่สามารถสร้างรายการชำระเงินได้');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      
      // Better error message handling
      let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setPayment(prev => ({ ...prev, status: 'error' }));
    } finally {
      // Status is already set in catch block or success flow
    }
  };

  const startPaymentStatusCheck = (ref: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payment/status/${ref}`);
        const data = await response.json();

        if (data.status === 'paid') {
          setPayment(prev => ({ ...prev, status: 'completed' }));
          toast.success('ชำระเงินสำเร็จ! เหรียญถูกเพิ่มเข้าบัญชีแล้ว');
        } else if (data.status === 'expired') {
          setPayment(prev => ({ ...prev, status: 'expired' }));
          toast.error('รายการชำระเงินหมดอายุแล้ว');
        } else if (data.status === 'pending') {
          // Continue checking
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error('Status check error:', error);
        setTimeout(checkStatus, 5000); // Retry after 5 seconds
      }
    };

    // Start checking after 3 seconds
    setTimeout(checkStatus, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('คัดลอกแล้ว!');
  };

  const resetPayment = () => {
    setPayment({
      amount: 0,
      qrCode: '',
      ref: '',
      status: 'idle',
    });
    setSelectedAmount(0);
  };

  if (payment.status === 'pending' || payment.status === 'checking') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            สแกน QR Code เพื่อชำระเงิน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
              <div className="w-48 h-48 mx-auto bg-muted rounded flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <p className="text-xs text-muted-foreground font-mono">{payment.ref}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              สแกน QR Code ด้วยแอปธนาคารของคุณ
            </p>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">จำนวนเงิน:</span>
              <span className="font-bold text-lg">฿{payment.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">เหรียญที่ได้:</span>
              <span className="font-bold text-green-600">+{payment.amount.toLocaleString()} เหรียญ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">หมายเลขอ้างอิง:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{payment.ref}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(payment.ref)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 animate-spin" />
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                รอการชำระเงิน
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบจะอัปเดตสถานะอัตโนมัติเมื่อได้รับเงิน
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetPayment}>
              ยกเลิก
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => startPaymentStatusCheck(payment.ref)}
              disabled={payment.status === 'checking'}
            >
              ตรวจสอบสถานะ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payment.status === 'completed') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">ชำระเงินสำเร็จ!</h3>
          <p className="text-green-700 mb-4">
            ได้รับ +{payment.amount.toLocaleString()} เหรียญ
          </p>
          <Button onClick={resetPayment}>
            เติมเงินอีกครั้ง
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (payment.status === 'expired' || payment.status === 'error') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">
            {payment.status === 'expired' ? 'หมดอายุแล้ว' : 'เกิดข้อผิดพลาด'}
          </h3>
          <p className="text-red-700 mb-4">
            {payment.status === 'expired' 
              ? 'รายการชำระเงินหมดอายุแล้ว กรุณาสร้างรายการใหม่' 
              : 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่'
            }
          </p>
          <Button onClick={resetPayment}>
            ลองใหม่
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          เติมเงิน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Amounts */}
        <div>
          <Label className="text-sm font-medium mb-3 block">จำนวนเงิน (บาท)</Label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {presetAmounts.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                className="h-12 flex-col"
                onClick={() => setSelectedAmount(amount)}
              >
                <span className="text-lg font-bold">฿{amount}</span>
                <span className="text-xs opacity-80">{amount} เหรียญ</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <Label htmlFor="custom-amount">หรือใส่จำนวนเงินเอง</Label>
          <Input
            id="custom-amount"
            type="number"
            placeholder="0"
            value={selectedAmount || ''}
            onChange={(e) => setSelectedAmount(Number(e.target.value))}
            min="1"
            max="10000"
          />
        </div>

        {/* Summary */}
        {selectedAmount > 0 && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>จำนวนเงิน:</span>
              <span className="font-bold">฿{selectedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>เหรียญที่ได้รับ:</span>
              <span className="font-bold text-green-600">+{selectedAmount.toLocaleString()} เหรียญ</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>เหรียญหลังเติม:</span>
              <span>{(userCoins + selectedAmount).toLocaleString()} เหรียญ</span>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <Button 
          className="w-full h-12" 
          onClick={handleCreatePayment}
          disabled={!selectedAmount || selectedAmount < 1 || payment.status === 'creating'}
        >
          {payment.status === 'creating' ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              กำลังสร้างรายการ...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              ชำระเงิน ฿{selectedAmount.toLocaleString()}
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 1 บาท = 1 เหรียญ</p>
          <p>• รองรับการชำระผ่าน PromptPay</p>
          <p>• เหรียญจะเข้าบัญชีทันทีหลังชำระเงิน</p>
          <p>• QR Code มีอายุ 15 นาที</p>
        </div>
      </CardContent>
    </Card>

    {/* QR Code Display Modal */}
    {console.log('QR Code Modal condition:', { showQRCode, hasQrCode: !!payment.qrCode, qrCodeLength: payment.qrCode?.length })}
    {showQRCode && payment.qrCode && (
      <QRCodeDisplay
        qrData={payment.qrCode}
        amount={payment.amount}
        ref={payment.ref}
        status={payment.status}
        onClose={() => {
          setShowQRCode(false);
          if (payment.status === 'completed') {
            window.location.reload();
          }
        }}
      />
    )}
  </>
  );
}