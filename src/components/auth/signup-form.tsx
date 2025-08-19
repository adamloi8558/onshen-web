"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { isValidPhone } from "@/lib/utils";
import TurnstileWidget from "@/components/ui/turnstile";

const signupSchema = z.object({
  phone: z.string()
    .min(1, "กรุณาใส่เบอร์โทรศัพท์")
    .refine(isValidPhone, "กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง"),
  password: z.string()
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    .max(100, "รหัสผ่านต้องมีไม่เกิน 100 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Turnstile handlers
  const handleTurnstileSuccess = (token: string) => {
    console.log('Signup Turnstile success:', token);
    setTurnstileToken(token);
  };

  const handleTurnstileError = () => {
    console.error('Signup Turnstile error');
    toast.error("การยืนยันไม่สำเร็จ กรุณาลองใหม่");
    setTurnstileToken("");
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!turnstileToken) {
      toast.error("กรุณายืนยันว่าคุณไม่ใช่บอท");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          turnstileToken,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "สมัครสมาชิกสำเร็จ");
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
        // Reset Turnstile on error
        if (typeof window !== 'undefined' && window.turnstile) {
          window.turnstile.reset();
          setTurnstileToken("");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รหัสผ่าน</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่านของคุณ"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="ยืนยันรหัสผ่านของคุณ"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cloudflare Turnstile */}
        <TurnstileWidget 
          onSuccess={handleTurnstileSuccess}
          onError={handleTurnstileError}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          สมัครสมาชิก
        </Button>
      </form>

      {typeof window !== 'undefined' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onTurnstileSuccess = function(token) {
                document.dispatchEvent(new CustomEvent('turnstileSuccess', { detail: token }));
              };
            `,
          }}
        />
      )}
    </Form>
  );
}