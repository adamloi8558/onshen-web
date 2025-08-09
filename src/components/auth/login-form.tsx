"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";

const loginSchema = z.object({
  phone: z.string().min(1, "กรุณาใส่เบอร์โทรศัพท์"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Cloudflare Turnstile callback
  useEffect(() => {
    const handleTurnstileSuccess = (event: CustomEvent) => {
      setTurnstileToken(event.detail);
    };

    document.addEventListener('turnstileSuccess', handleTurnstileSuccess as EventListener);
    
    return () => {
      document.removeEventListener('turnstileSuccess', handleTurnstileSuccess as EventListener);
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (!turnstileToken) {
      toast.error("กรุณายืนยันว่าคุณไม่ใช่บอท");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
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
        toast.success(result.message || "เข้าสู่ระบบสำเร็จ");
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
      console.error("Login error:", error);
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

        {/* Cloudflare Turnstile */}
        <div className="flex justify-center">
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
            data-callback="onTurnstileSuccess"
          ></div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          เข้าสู่ระบบ
        </Button>

        <div className="text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>
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