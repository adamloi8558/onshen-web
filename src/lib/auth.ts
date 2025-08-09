import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface JWTPayload {
  userId: string;
  phone: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'auth-token';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setAuthCookie(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<void> {
  const token = createJWT(payload);
  const cookieStore = cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<{
  id: string;
  phone: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  coins: number;
  balance: string;
  is_vip: boolean;
  vip_expires_at: Date | null;
} | null> {
  try {
    // Skip during build with placeholder database
    if (!db || process.env.DATABASE_URL?.includes("placeholder")) {
      return null;
    }

    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return null;
    }

    const [user] = await db
      .select({
        id: users.id,
        phone: users.phone,
        role: users.role,
        avatar_url: users.avatar_url,
        coins: users.coins,
        balance: users.balance,
        is_vip: users.is_vip,
        vip_expires_at: users.vip_expires_at,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Check if VIP has expired
    if (user.is_vip && user.vip_expires_at && user.vip_expires_at < new Date()) {
      await db
        .update(users)
        .set({ 
          is_vip: false, 
          vip_expires_at: null,
          updated_at: new Date(),
        })
        .where(eq(users.id, user.id));
      
      user.is_vip = false;
      user.vip_expires_at = null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<{
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  coins: number;
  balance: string;
  is_vip: boolean;
  vip_expires_at: Date | null;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireAdmin(): Promise<{
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  coins: number;
  balance: string;
  is_vip: boolean;
  vip_expires_at: Date | null;
}> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}