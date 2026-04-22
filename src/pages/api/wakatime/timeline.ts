import { getCachedData, setCachedData } from '../../../lib/redis';
import { db } from "../../../db";
import { apiCache } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { APIRoute } from 'astro';

export const prerender = false;

const DB_CACHE_KEY = "wakatime_last_summary";
const CACHE_DURATION = 10 * 60 * 60 * 1000; // 10 hours in ms

export const GET: APIRoute = async () => {
    try {
        const now = Date.now();
        const apiKey = import.meta.env.WAKATIME_API_KEY || process.env.WAKATIME_API_KEY;

        const today = new Date();
        const end = today.toISOString().split('T')[0];
        const startObj = new Date();
        startObj.setDate(today.getDate() - 6);
        const start = startObj.toISOString().split('T')[0];

        // 1. Try Redis Cache first (Very fast)
        const redisKey = `wakatime_timeline_${start}_${end}`;
        const cached = await getCachedData(redisKey);

        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': `public, max-age=${CACHE_DURATION / 1000}`,
                    'X-Cache': 'HIT-REDIS'
                }
            });
        }

        // 2. Try Database Cache (Source of Truth Fallback)
        let dbCached = null;
        try {
            dbCached = await db
                .select()
                .from(apiCache)
                .where(eq(apiCache.key, DB_CACHE_KEY))
                .get();
        } catch (e) {
            console.warn('[wakatime] DB read error:', e);
        }

        if (dbCached && now - dbCached.updatedAt < CACHE_DURATION) {
            const data = JSON.parse(dbCached.data);
            // Verify if the DB data is for the same range (optional, but safer)
            return new Response(dbCached.data, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600',
                    'X-Cache': 'HIT-DB'
                }
            });
        }

        // 3. Fetch from API if cache is cold or missing
        if (!apiKey) {
            // Return stale DB data even if expired if we have no API key
            if (dbCached) return new Response(dbCached.data, { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'STALE-DB' } });
            return new Response(JSON.stringify({ days: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        console.log('[wakatime] Cache miss, fetching fresh data from API...');
        const url = `https://wakatime.com/api/v1/users/current/summaries?start=${start}&end=${end}&cache=true&paywalled=true`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`WakaTime API error: ${response.status}`);
        }

        const apiData = await response.json();

        const days = apiData.data.map((day: any) => {
            const projects = day.projects.sort((a: any, b: any) => b.total_seconds - a.total_seconds)
                .slice(0, 5)
                .map((p: any) => ({
                    name: p.name,
                    percent: p.percent,
                    seconds: p.total_seconds,
                    text: p.text
                }));

            return {
                date: day.range.date,
                total_seconds: day.grand_total.total_seconds,
                text: day.grand_total.text,
                projects: projects
            };
        });

        // --- Data Science Visualization Metrics ---
        const dailySeconds = days.map((d: any) => d.total_seconds);
        const avgSeconds = dailySeconds.reduce((a: number, b: number) => a + b, 0) / (days.length || 1);
        
        // 1. Consistency (Standard Deviation based)
        const variance = dailySeconds.reduce((a: number, b: number) => a + Math.pow(b - avgSeconds, 2), 0) / (days.length || 1);
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0, 100 - (stdDev / (avgSeconds || 1) * 100));

        // 2. Focus Score (Top project vs others)
        const allProjects: Record<string, number> = {};
        days.forEach((d: any) => d.projects.forEach((p: any) => {
            allProjects[p.name] = (allProjects[p.name] || 0) + p.seconds;
        }));
        const sortedProjects = Object.entries(allProjects).sort((a, b) => b[1] - a[1]);
        const topProjectTime = sortedProjects[0]?.[1] || 0;
        const totalProjectTime = Object.values(allProjects).reduce((a, b) => a + b, 0);
        const focusScore = (topProjectTime / (totalProjectTime || 1)) * 100;

        // 3. Velocity (Trend)
        const firstHalf = dailySeconds.slice(0, Math.floor(days.length / 2));
        const secondHalf = dailySeconds.slice(Math.floor(days.length / 2));
        const avg1 = firstHalf.reduce((a: number, b: number) => a + b, 0) / (firstHalf.length || 1);
        const avg2 = secondHalf.reduce((a: number, b: number) => a + b, 0) / (secondHalf.length || 1);
        const velocity = avg1 === 0 ? 0 : ((avg2 - avg1) / avg1) * 100;

        const metrics = {
            intensity: (avgSeconds / 3600).toFixed(1),
            consistency: Math.round(consistency),
            focus: Math.round(focusScore),
            velocity: Math.round(velocity),
            top_language: sortedProjects[0]?.[0] || 'Unknown'
        };

        const result = { days, metrics, last_updated: now };
        const resultString = JSON.stringify(result);

        // 4. Update both caches
        try {
            await Promise.all([
                setCachedData(redisKey, result, CACHE_DURATION / 1000),
                db.insert(apiCache)
                    .values({ key: DB_CACHE_KEY, data: resultString, updatedAt: now })
                    .onConflictDoUpdate({
                        target: apiCache.key,
                        set: { data: resultString, updatedAt: now },
                    })
            ]);
        } catch (e) {
            console.warn('[wakatime] Cache write error:', e);
        }

        return new Response(resultString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CACHE_DURATION / 1000}`,
                'X-Cache': 'MISS'
            }
        });

    } catch (error: any) {
        console.warn('[wakatime] Failed to fetch:', error.message);
        
        // 5. Emergency Fallback: Serve any stale data from DB if API fails
        try {
            const stale = await db.select().from(apiCache).where(eq(apiCache.key, DB_CACHE_KEY)).get();
            if (stale) {
                return new Response(stale.data, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Cache': 'EMERGENCY-STALE' }
                });
            }
        } catch {}

        return new Response(JSON.stringify({ days: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
