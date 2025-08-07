import { db, rate_limits } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockMinutes: number;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 15 },
  signup: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  forgot_password: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  upload: { maxAttempts: 10, windowMinutes: 60, blockMinutes: 30 },
  password_reset: { maxAttempts: 5, windowMinutes: 60, blockMinutes: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date | null;
  blockedUntil: Date | null;
}

export async function checkRateLimit(
  identifier: string, // IP address or user ID
  action: keyof typeof rateLimitConfigs
): Promise<RateLimitResult> {
  const config = rateLimitConfigs[action];
  if (!config) {
    throw new Error(`Unknown rate limit action: ${action}`);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  try {
    // Get existing rate limit record
    const [existingRecord] = await db
      .select()
      .from(rate_limits)
      .where(and(
        eq(rate_limits.identifier, identifier),
        eq(rate_limits.action, action)
      ))
      .limit(1);

    // If no existing record, create one
    if (!existingRecord) {
      await db.insert(rate_limits).values({
        identifier,
        action,
        attempts: 1,
        last_attempt_at: now,
      });

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
        blockedUntil: null,
      };
    }

    // Check if currently blocked
    if (existingRecord.blocked_until && existingRecord.blocked_until > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: null,
        blockedUntil: existingRecord.blocked_until,
      };
    }

    // Check if outside the window (reset attempts)
    if (existingRecord.last_attempt_at < windowStart) {
      await db
        .update(rate_limits)
        .set({
          attempts: 1,
          last_attempt_at: now,
          blocked_until: null,
          updated_at: now,
        })
        .where(and(
          eq(rate_limits.identifier, identifier),
          eq(rate_limits.action, action)
        ));

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
        blockedUntil: null,
      };
    }

    // Check if exceeded max attempts
    if (existingRecord.attempts >= config.maxAttempts) {
      const blockedUntil = new Date(now.getTime() + config.blockMinutes * 60 * 1000);
      
      await db
        .update(rate_limits)
        .set({
          blocked_until: blockedUntil,
          updated_at: now,
        })
        .where(and(
          eq(rate_limits.identifier, identifier),
          eq(rate_limits.action, action)
        ));

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: null,
        blockedUntil,
      };
    }

    // Increment attempts
    const newAttempts = existingRecord.attempts + 1;
    await db
      .update(rate_limits)
      .set({
        attempts: newAttempts,
        last_attempt_at: now,
        updated_at: now,
      })
      .where(and(
        eq(rate_limits.identifier, identifier),
        eq(rate_limits.action, action)
      ));

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - newAttempts,
      resetTime: new Date(existingRecord.last_attempt_at.getTime() + config.windowMinutes * 60 * 1000),
      blockedUntil: null,
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      resetTime: null,
      blockedUntil: null,
    };
  }
}

export function getRateLimitHeaders(result: RateLimitResult, action: keyof typeof rateLimitConfigs): Record<string, string> {
  const config = rateLimitConfigs[action];
  const headers: Record<string, string> = {};

  headers['X-RateLimit-Limit'] = config.maxAttempts.toString();
  headers['X-RateLimit-Remaining'] = Math.max(0, result.remainingAttempts).toString();

  if (result.resetTime) {
    headers['X-RateLimit-Reset'] = Math.ceil(result.resetTime.getTime() / 1000).toString();
  }

  if (result.blockedUntil) {
    headers['Retry-After'] = Math.ceil((result.blockedUntil.getTime() - Date.now()) / 1000).toString();
  }

  return headers;
}