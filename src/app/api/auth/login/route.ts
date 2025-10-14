import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const loginSchema = z.object({
  phone: z.string().min(1, 'กรุณาใส่เบอร์โทรศัพท์'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  turnstileToken: z.string().min(1, 'กรุณายืนยันว่าคุณไม่ใช่บอท'),
});

function getClientIP(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim().length > 0) return cfIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && realIP.trim().length > 0) return realIP.trim();

  return '';
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return true; // Skip verification if no secret key
  }

  try {
    const params = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    // Only include remoteip if we actually have an IP; sending an invalid value can cause failure
    if (ip && ip.length > 0) {
      params.set('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const result = await response.json();
    console.log('🔍 Turnstile verify response:', {
      success: result.success,
      'error-codes': result['error-codes'],
      challenge_ts: result.challenge_ts,
      hostname: result.hostname,
      ip: ip
    });
    
    if (!result.success) {
      console.warn('❌ Turnstile verify failed', { 
        ip, 
        result,
        'error-codes': result['error-codes'],
        possibleCauses: result['error-codes']?.includes('invalid-input-secret') ? 'Wrong SECRET_KEY' :
                       result['error-codes']?.includes('timeout-or-duplicate') ? 'Token expired or reused' :
                       result['error-codes']?.includes('invalid-input-response') ? 'Invalid token format' :
                       'Unknown error'
      });
    }
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
    const rateLimitResult = await checkRateLimit(clientIP, 'login');
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, 'login');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ในภายหลัง',
          blockedUntil: rateLimitResult.blockedUntil,
        },
        { 
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const body = await request.json();
    const validatedData = loginSchema.parse(body);

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

    // Find user by phone
    const [user] = await db
      .select({
        id: users.id,
        phone: users.phone,
        password_hash: users.password_hash,
        role: users.role,
        avatar_url: users.avatar_url,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
      })
      .from(users)
      .where(eq(users.phone, validatedData.phone))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง' },
        { 
          status: 401,
          headers: rateLimitHeaders,
        }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(validatedData.password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง' },
        { 
          status: 401,
          headers: rateLimitHeaders,
        }
      );
    }

    // Update last login
    await db
      .update(users)
      .set({ 
        last_login_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    // Set auth cookie
    await setAuthCookie({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    // Return user data (without password)
    const responseHeaders = new Headers(rateLimitHeaders);
    return NextResponse.json(
      {
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          avatar_url: user.avatar_url,
          coins: user.coins,
          balance: user.balance,
          is_vip: user.is_vip,
          vip_expires_at: user.vip_expires_at,
        },
        message: 'เข้าสู่ระบบสำเร็จ',
      },
      { 
        status: 200,
        headers: responseHeaders,
      }
    );

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}