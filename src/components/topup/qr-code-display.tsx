'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  qrData: string;
  amount: number;
  ref: string;
  status: 'idle' | 'creating' | 'pending' | 'checking' | 'completed' | 'expired' | 'error';
  onClose: () => void;
}

export default function QRCodeDisplay({ qrData, amount, ref, status, onClose }: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  
  // Debug logging
  console.log('QRCodeDisplay props:', { qrData, amount, ref, status });
  console.log('QR Data length:', qrData?.length);
  console.log('QR Data preview:', qrData?.substring(0, 50) + '...');

  useEffect(() => {
    if (status !== 'pending') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          badge: <Badge variant="default" className="bg-green-100 text-green-800">ชำระเงินสำเร็จ</Badge>,
          color: 'border-green-200'
        };
      case 'expired':
        return {
          icon: <Clock className="w-5 h-5 text-red-500" />,
          badge: <Badge variant="destructive">หมดเวลา</Badge>,
          color: 'border-red-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          badge: <Badge variant="destructive">เกิดข้อผิดพลาด</Badge>,
          color: 'border-red-200'
        };
      case 'creating':
        return {
          icon: <Clock className="w-5 h-5 text-orange-500" />,
          badge: <Badge variant="secondary" className="bg-orange-100 text-orange-800">กำลังสร้างรายการ</Badge>,
          color: 'border-orange-200'
        };
      case 'checking':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">กำลังตรวจสอบ</Badge>,
          color: 'border-yellow-200'
        };
      default: // idle, pending
        return {
          icon: <Clock className="w-5 h-5 text-blue-500" />,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">รอการชำระเงิน</Badge>,
          color: 'border-blue-200'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className={`w-full max-w-md ${statusConfig.color}`}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {statusConfig.icon}
            {statusConfig.badge}
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            ฿{amount.toLocaleString()}
          </CardTitle>
          {status === 'pending' && (
            <p className="text-sm text-gray-600">
              เวลาที่เหลือ: <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {(status === 'pending' || status === 'idle') && (
            <>
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                {qrData && qrData.length > 0 ? (
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    level="M"
                    includeMargin
                    className="border rounded"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 border rounded">
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚠️</div>
                      <p className="text-sm text-gray-600">QR Code ไม่สามารถแสดงได้</p>
                      <p className="text-xs text-gray-500 mt-1">qrData: {qrData || 'null'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-gray-800">วิธีการชำระเงิน</h3>
                <ol className="text-sm text-gray-600 space-y-1 text-left">
                  <li>1. เปิดแอปธนาคารหรือ Mobile Banking</li>
                  <li>2. เลือกเมนู &quot;สแกน QR Code&quot; หรือ &quot;PromptPay&quot;</li>
                  <li>3. สแกน QR Code ด้านบน</li>
                  <li>4. ตรวจสอบจำนวนเงินและยืนยันการชำระ</li>
                </ol>
              </div>

              {/* Reference Number */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">หมายเลขอ้างอิง</p>
                    <p className="font-mono text-sm">{ref}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(ref, 'หมายเลขอ้างอิง')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {status === 'completed' && (
            <div className="text-center space-y-4">
              <div className="text-green-600">
                <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                <h3 className="text-xl font-semibold">ชำระเงินสำเร็จ!</h3>
                <p className="text-sm text-gray-600">
                  เหรียญจำนวน {amount} เหรียญถูกเพิ่มเข้าบัญชีแล้ว
                </p>
              </div>
            </div>
          )}

          {(status === 'expired' || status === 'error') && (
            <div className="text-center space-y-4">
              <div className="text-red-600">
                {status === 'expired' ? (
                  <>
                    <Clock className="w-16 h-16 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold">หมดเวลาชำระเงิน</h3>
                    <p className="text-sm text-gray-600">
                      กรุณาสร้างรายการใหม่เพื่อทำการชำระเงิน
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold">เกิดข้อผิดพลาด</h3>
                    <p className="text-sm text-gray-600">
                      ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full"
            variant={status === 'completed' ? 'default' : 'outline'}
          >
            {status === 'completed' ? 'เสร็จสิ้น' : 'ปิด'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}