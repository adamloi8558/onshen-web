import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  turnstileToken: z.string().min(1, "Turnstile token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, turnstileToken } = forgotPasswordSchema.parse(body);

    // Verify Turnstile token
    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || "",
          response: turnstileToken,
        }),
      }
    );

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: "การยืนยันไม่สำเร็จ" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [existingUser] = await db!
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "ไม่พบเบอร์โทรศัพท์นี้ในระบบ" },
        { status: 404 }
      );
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    await db!
      .update(users)
      .set({
        reset_otp: otp,
        reset_otp_expires: otpExpiry,
        updated_at: new Date(),
      })
      .where(eq(users.phone, phone));

    // In a real application, you would send SMS here
    // For now, we'll just log it (remove in production)
    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      message: "ส่งรหัส OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}