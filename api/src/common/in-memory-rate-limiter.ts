import { Injectable } from '@nestjs/common';

type Bucket = { count: number; resetAt: number };

/**
 * In-process rate limiter (MVP / Stage 09).
 * Limitations: not shared across instances; resets on process restart.
 * Suitable for single-process deploy; replace before multi-instance production.
 */
@Injectable()
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  /**
   * @returns true if allowed, false if rate limited
   */
  attempt(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (existing.count >= limit) {
      return false;
    }
    existing.count += 1;
    return true;
  }
}

/** @deprecated alias — kept so existing AuthModule imports keep compiling during Stage 09 */
export { InMemoryRateLimiter as AuthRateLimiter };
