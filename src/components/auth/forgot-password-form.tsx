"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  phone: z.string().min(1, "กรุณาใส่เบอร์โทรศัพท์"),
});

const resetPasswordSchema = z.object({
  phone: z.string().min(1, "กรุณาใส่เบอร์โทรศัพท์"),
  otp: z.string().min(6, "รหัส OTP ต้องมี 6 หลัก"),
  newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string().min(6, "กรุณายืนยันรหัสผ่าน"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "reset" | "success">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const phoneForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phone: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Cloudflare Turnstile callbacks
  useEffect(() => {
    const handleTurnstileSuccess = (event: CustomEvent) => {
      console.log('Turnstile success received:', event.detail);
      setTurnstileToken(event.detail);
    };

    const handleTurnstileError = (event: CustomEvent) => {
      console.error('Turnstile error received:', event.detail);
      toast.error("การยืนยันไม่สำเร็จ กรุณาลองใหม่");
      setTurnstileToken("");
    };

    const handleTurnstileExpired = () => {
      console.warn('Turnstile expired');
      toast.warning("การยืนยันหมดอายุ กรุณาลองใหม่");
      setTurnstileToken("");
    };

    const handleTurnstileTimeout = () => {
      console.warn('Turnstile timeout');
      toast.error("การยืนยันใช้เวลานานเกินไป กรุณาลองใหม่");
      setTurnstileToken("");
    };

    document.addEventListener('turnstileSuccess', handleTurnstileSuccess as EventListener);
    document.addEventListener('turnstileError', handleTurnstileError as EventListener);
    document.addEventListener('turnstileExpired', handleTurnstileExpired as EventListener);
    document.addEventListener('turnstileTimeout', handleTurnstileTimeout as EventListener);
    
    return () => {
      document.removeEventListener('turnstileSuccess', handleTurnstileSuccess as EventListener);
      document.removeEventListener('turnstileError', handleTurnstileError as EventListener);
      document.removeEventListener('turnstileExpired', handleTurnstileExpired as EventListener);
      document.removeEventListener('turnstileTimeout', handleTurnstileTimeout as EventListener);
    };
  }, []);

  const onSubmitPhone = async (data: ForgotPasswordFormData) => {
    if (!turnstileToken) {
      toast.error("กรุณายืนยันว่าคุณไม่ใช่บอท");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: data.phone,
          turnstileToken,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("ส่งรหัส OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว");
        setPhoneNumber(data.phone);
        resetForm.setValue("phone", data.phone);
        setStep("reset");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
        // Reset Turnstile on error
        if (typeof window !== 'undefined' && window.turnstile) {
          window.turnstile.reset();
          setTurnstileToken("");
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: data.phone,
          otp: data.otp,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
        setStep("success");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            เปลี่ยนรหัสผ่านสำเร็จ
          </h3>
          <p className="text-slate-600">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </p>
        </div>
        <Link href="/auth/login">
          <Button className="w-full">
            เข้าสู่ระบบ
          </Button>
        </Link>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("phone")}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold">รีเซ็ตรหัสผ่าน</h3>
            <p className="text-sm text-slate-600">
              ส่งรหัส OTP ไปยัง {phoneNumber}
            </p>
          </div>
        </div>

        <Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-4">
            <FormField
              control={resetForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัส OTP</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ใส่รหัส OTP 6 หลัก"
                      maxLength={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่านใหม่</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="รหัสผ่านใหม่"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              เปลี่ยนรหัสผ่าน
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <Form {...phoneForm}>
      <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-6">
        <FormField
          control={phoneForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เบอร์โทรศัพท์</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="08x-xxx-xxxx"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cloudflare Turnstile */}
        <div className="flex justify-center">
          <div
            className="cf-turnstile"
            data-sitekey="0x4AAAAABsXjXiK8Z15XV7m"
            data-callback="onTurnstileSuccess"
            data-error-callback="onTurnstileError"
            data-expired-callback="onTurnstileExpired"
            data-timeout-callback="onTurnstileTimeout"
          ></div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          ส่งรหัส OTP
        </Button>
      </form>


    </Form>
  );
}