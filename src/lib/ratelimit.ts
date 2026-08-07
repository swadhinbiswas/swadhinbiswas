import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
    analytics: true,
  });
  return ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  const rl = getRatelimit();
  if (!rl) return { success: true, remaining: 999 }; // No rate limit if Redis unavailable

  try {
    const result = await rl.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch {
    return { success: true, remaining: 999 };
  }
}

// Stricter limiter for auth endpoints (5 attempts per minute)
export async function checkAuthRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { success: true, remaining: 999 };

  const redis = new Redis({ url, token });
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 attempts per minute
    analytics: true,
  });

  try {
    const result = await rl.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch {
    return { success: true, remaining: 999 };
  }
}
