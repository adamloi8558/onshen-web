import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { isValidEmail, isValidPhone } from '@/lib/utils';

const signupSchema = z.object({
  username: z.string()
    .min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(50, 'ชื่อผู้ใช้ต้องมีไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-zA-Z0-9_]+$/, 'ชื่อผู้ใช้สามารถใช้ได้เฉพาะตัวอักษร ตัวเลข และ _'),
  email: z.string()
    .min(1, 'กรุณาใส่อีเมล')
    .refine(isValidEmail, 'กรุณาใส่อีเมลที่ถูกต้อง'),
  phone: z.string()
    .min(1, 'กรุณาใส่เบอร์โทรศัพท์')
    .refine(isValidPhone, 'กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง'),
  password: z.string()
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    .max(100, 'รหัสผ่านต้องมีไม่เกิน 100 ตัวอักษร'),
  confirmPassword: z.string(),
  turnstileToken: z.string().min(1, 'กรุณายืนยันว่าคุณไม่ใช่บอท'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  return 'unknown';
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return true; // Skip verification if no secret key
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false; // Fail safe
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'signup');
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, 'signup');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'คุณสมัครสมาชิกบ่อยเกินไป กรุณาลองใหม่ในภายหลัง',
          blockedUntil: rateLimitResult.blockedUntil,
        },
        { 
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Verify Turnstile token
    const turnstileValid = await verifyTurnstile(validatedData.turnstileToken, clientIP);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'การยืนยันความปลอดภัยล้มเหลว กรุณาลองใหม่อีกครั้ง' },
        { 
          status: 400,
          headers: rateLimitHeaders,
        }
      );
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, validatedData.username))
      .limit(1);

    if (existingUsername) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' },
        { 
          status: 400,
          headers: rateLimitHeaders,
        }
      );
    }

    // Check if email already exists
    const [existingEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.email.toLowerCase()))
      .limit(1);

    if (existingEmail) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้แล้ว' },
        { 
          status: 400,
          headers: rateLimitHeaders,
        }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: validatedData.username,
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone,
        password_hash: passwordHash,
        avatar_url: '/avatars/default.webp',
        role: 'user',
        coins: 0,
        balance: '0.00',
        is_vip: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        avatar_url: users.avatar_url,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
      });

    // Set auth cookie
    await setAuthCookie({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return user data
    const responseHeaders = new Headers(rateLimitHeaders);
    return NextResponse.json(
      {
        user: newUser,
        message: 'สมัครสมาชิกสำเร็จ',
      },
      { 
        status: 201,
        headers: responseHeaders,
      }
    );

  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      if (error.message.includes('username')) {
        return NextResponse.json(
          { error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' },
          { status: 400 }
        );
      }
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกใช้แล้ว' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}