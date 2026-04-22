import { db } from '../../../db';
import { apiCache } from '../../../db/schema';
import { eq, like } from 'drizzle-orm';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        // Fetch all GitHub related stats from apiCache
        const results = await db
            .select()
            .from(apiCache)
            .where(like(apiCache.key, 'github_stat_%'))
            .all();

        const stats: Record<string, any> = {};
        
        results.forEach(row => {
            const key = row.key.replace('github_stat_', '');
            try {
                stats[key] = JSON.parse(row.data);
            } catch {
                stats[key] = row.data;
            }
        });

        // Basic validation - if empty, we might not have run the cron yet
        if (Object.keys(stats).length === 0) {
            return new Response(JSON.stringify({ error: 'No stats found in database yet' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error: any) {
        console.error("[api/github/stats] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
