import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// In-memory L1 cache (instant, per-server-process)
const mem = new Map<string, { data: any; exp: number }>();
const MEM_TTL = 30_000; // 30s in-memory, then Upstash

function memGet(key: string) {
  const e = mem.get(key);
  if (!e) return undefined;
  if (Date.now() > e.exp) { mem.delete(key); return undefined; }
  return e.data;
}

function memSet(key: string, data: any) {
  mem.set(key, { data, exp: Date.now() + MEM_TTL });
}

// Hard timeout — a slow/far-away cache must NEVER block a page render.
// The DB (same region as the serverless function) is the fast path.
const CACHE_TIMEOUT_MS = 600;

function withTimeout<T>(p: Promise<T>): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), CACHE_TIMEOUT_MS);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      () => { clearTimeout(t); resolve(null); }
    );
  });
}

export async function getCachedData(key: string) {
  // L1: memory (instant)
  const m = memGet(key);
  if (m !== undefined) return m;
  // L2: Upstash with timeout
  const r = getRedis();
  if (!r) return null;
  const raw = await withTimeout(r.get(key));
  if (raw == null) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    memSet(key, data);
    return data;
  } catch {
    await r.del(key).catch(() => {});
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 300) {
  memSet(key, data);
  const r = getRedis();
  if (!r) return;
  try {
    await withTimeout(r.set(key, JSON.stringify(data), { ex: ttlSeconds }));
  } catch {}
}

export async function deleteKey(key: string) {
  mem.delete(key);
  const r = getRedis();
  if (!r) return;
  try { await withTimeout(r.del(key)); } catch {}
}

export async function deletePattern(pattern: string) {
  // Clear matching memory keys
  for (const k of mem.keys()) {
    if (k.includes(pattern.replace('*', ''))) mem.delete(k);
  }
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await withTimeout(r.keys(pattern));
    if (keys && keys.length) await withTimeout(r.del(...keys));
  } catch {}
}
