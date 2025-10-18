'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, Eye, X } from "lucide-react";
import { QRCodeDataURL } from "@/components/ui/qr-code";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  description: string | null;
  payment_ref: string | null;
  created_at: Date;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  const handleViewTransaction = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    
    // Fetch QR code from payment gateway if available
    if (transaction.payment_ref && transaction.type === 'topup') {
      setIsLoadingQR(true);
      try {
        const response = await fetch(`/api/payment/status/${transaction.payment_ref}`);
        if (response.ok) {
          const data = await response.json();
          setQrCode(data.transfer_qrcode || null);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setIsLoadingQR(false);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
    setQrCode(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            สำเร็จ
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            รอชำระ
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            ล้มเหลว
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'topup':
        return 'text-green-600';
      case 'vip_purchase':
        return 'text-yellow-600';
      case 'withdrawal':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">
                  {transaction.type === 'topup' ? 'เติมเหรียญ' : 
                   transaction.type === 'vip_purchase' ? 'ซื้อ VIP' : 
                   transaction.description}
                </span>
                {getStatusBadge(transaction.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {transaction.description}
              </p>
              {transaction.payment_ref && (
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  อ้างอิง: {transaction.payment_ref}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(transaction.created_at).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="text-right flex items-center gap-3">
              <div>
                <div className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === 'topup' ? '+' : transaction.type === 'vip_purchase' ? '-' : ''}
                  {parseFloat(transaction.amount)} บาท
                </div>
                {transaction.type === 'topup' && transaction.status === 'completed' && (
                  <div className="text-sm text-amber-600">
                    +{parseFloat(transaction.amount)} เหรียญ
                  </div>
                )}
              </div>
              
              {transaction.payment_ref && transaction.type === 'topup' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewTransaction(transaction)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCloseModal}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold mb-2">
                {selectedTransaction.type === 'topup' ? 'เติมเหรียญ' : selectedTransaction.description}
              </h3>
              {getStatusBadge(selectedTransaction.status)}
            </div>

            {isLoadingQR ? (
              <div className="flex justify-center p-4 mb-4">
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">กำลังโหลด QR Code...</p>
                  </div>
                </div>
              </div>
            ) : qrCode ? (
              <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-300 mb-4">
                <QRCodeDataURL
                  value={qrCode}
                  size={200}
                  className="block"
                />
              </div>
            ) : (
              <div className="flex justify-center p-4 mb-4">
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted rounded border">
                  <p className="text-sm text-muted-foreground text-center">
                    ไม่พบ QR Code<br/>สำหรับรายการนี้
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">สถานะรายการ</span>
                <span className="font-medium">{selectedTransaction.type === 'topup' ? 'เติมเหรียญ' : 'เติมเงิน'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">รหัสรายการ</span>
                <span className="font-mono">{selectedTransaction.payment_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">หมายเลขอ้างอิง</span>
                <span className="font-mono">{selectedTransaction.payment_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ช่องทางการเติมเงิน</span>
                <span>Promptpay</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">วันที่ทำรายการ</span>
                <span>
                  {new Date(selectedTransaction.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>จำนวนเหรียญ</span>
                <span className="text-amber-600">
                  {selectedTransaction.type === 'topup' ? '+' : ''}{parseFloat(selectedTransaction.amount)} เหรียญ
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleCloseModal}
            >
              ปิด
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
