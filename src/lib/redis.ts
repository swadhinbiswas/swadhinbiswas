import { createClient } from 'redis';

// Initialize Redis client
let redis: any = null;

async function getRedisClient() {
    if (redis) return redis;

    // Use REDIS_URL or KV_URL (Standard TCP connection strings)
    // NOTE: KV_REST_API_URL is HTTP-only and fails with node-redis
    const url = process.env.REDIS_URL || process.env.KV_REDIS_URL;

    if (!url) {
        if (import.meta.env.PROD) {
            console.warn('REDIS_URL/KV_URL missing. Caching disabled. (KV_REST_API_URL cannot be used with node-redis)');
        }
        return null;
    }

    // Ensure protocol is valid for node-redis (redis:// or rediss://)
    if (url.startsWith('https://') || url.startsWith('http://')) {
        console.error('Redis URL starts with http/https, which is incompatible with node-redis. Please use REDIS_URL or KV_URL.');
        return null;
    }
    try {
        console.log('Initializing Redis connection...');
        const client = createClient({ url });

        client.on('error', (err) => console.error('Redis Client Error', err));

        await client.connect();
        redis = client;
        return redis;
    }
    catch (e) {
        console.error('Failed to connect to Redis:', e);
        return null;
    }
}


export async function getCachedData(key: string) {
    const client = await getRedisClient();
    if (!client) return null;
    try {
        const data = await client.get(key);
        // 'redis' package returns string or null
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Redis get error:', e);
        return null;
    }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number) {
    const client = await getRedisClient();
    if (!client) return;
    try {
        await client.set(key, JSON.stringify(data), { EX: ttlSeconds });
    } catch (e) {
        console.error('Redis set error:', e);
    }
}

export async function incrementKey(key: string, amount: number = 1) {
    const client = await getRedisClient();
    if (!client) return 0;
    try {
        return await client.incrBy(key, amount);
    } catch (e) {
        console.error('Redis incr error:', e);
        return 0;
    }
}
