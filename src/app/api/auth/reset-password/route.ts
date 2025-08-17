import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, newPassword } = resetPasswordSchema.parse(body);

    // Find user with valid OTP
    const [user] = await db!
      .select()
      .from(users)
      .where(
        and(
          eq(users.phone, phone),
          eq(users.reset_otp, otp)
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "รหัส OTP ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (!user.reset_otp_expires || new Date() > user.reset_otp_expires) {
      return NextResponse.json(
        { error: "รหัส OTP หมดอายุแล้ว" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear OTP
    await db!
      .update(users)
      .set({
        password_hash: hashedPassword,
        reset_otp: null,
        reset_otp_expires: null,
        updated_at: new Date(),
      })
      .where(eq(users.phone, phone));

    return NextResponse.json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    
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