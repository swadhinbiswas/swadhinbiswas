import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;

// Use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
const url = import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
    console.log('Initializing Upstash Redis connection...');
    redis = new Redis({
        url,
        token,
    });
} else {
    // Only warn if we expect to have it but don't (e.g. in prod)
    if (import.meta.env.PROD) {
        console.warn('UPSTASH_REDIS_REST_URL or TOKEN missing. Caching disabled.');
    }
}

export async function getCachedData(key: string) {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        // Upstash automatically parses JSON if it was stored as JSON, but we stringified it.
        // If type is generic, it might return object.
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        console.error('Redis get error:', e);
        return null;
    }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number) {
    if (!redis) return;
    try {
        // Upstash REST API handles JSON serialization, but consistent stringify is safer
        // if we want to match previous behavior exactly.
        // However, Upstash SDK prefers objects.
        // Let's stick to JSON.stringify for consistency with getCachedData parsing logic above if needed.
        // Actually, Upstash SDK can handle objects directly.
        // But to be safe and simple:
        await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
    } catch (e) {
        console.error('Redis set error:', e);
    }
}

export async function incrementKey(key: string, amount: number = 1) {
    if (!redis) return 0;
    try {
        return await redis.incrby(key, amount);
    } catch (e) {
        console.error('Redis incr error:', e);
        return 0;
    }
}
