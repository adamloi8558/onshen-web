"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error?: string;
  reset?: () => void;
}

export function AdminErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">เกิดข้อผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              ขออภัย เกิดข้อผิดพลาดในการโหลดหน้านี้
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-mono">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {reset && (
                <Button onClick={reset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  ลองใหม่
                </Button>
              )}
              
              <Button variant="outline" asChild>
                <Link href="/admin">
                  กลับแดชบอร์ด
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/admin/simple">
                  Simple Mode
                </Link>
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                หากปัญหายังคงมีอยู่ กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}