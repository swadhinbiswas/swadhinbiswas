
import { getCachedData, setCachedData } from '../../../lib/redis';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const apiKey = import.meta.env.WAKATIME_API_KEY || process.env.WAKATIME_API_KEY;

        // Calculate dates for last 7 days
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        const startObj = new Date();
        startObj.setDate(today.getDate() - 6);
        const start = startObj.toISOString().split('T')[0];

        // Try to get from cache first
        const cacheKey = `wakatime_timeline_${start}_${end}`;
        const cached = await getCachedData(cacheKey);

        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=43200' // 12 hours
                }
            });
        }

        if (!apiKey) {
            // Return empty structure if no key, to prevent frontend errors
            return new Response(JSON.stringify({ days: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch from WakaTime
        const url = `https://wakatime.com/api/v1/users/current/summaries?start=${start}&end=${end}&cache=true&paywalled=true`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`
            }
        });

        if (!response.ok) {
            throw new Error(`WakaTime API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform data for frontend
        const days = data.data.map((day: any) => {
            // Filter and sort projects
            const projects = day.projects.sort((a: any, b: any) => b.total_seconds - a.total_seconds)
                .slice(0, 5) // Top 5
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

        const result = { days };

        // Cache the result for 12 hours
        await setCachedData(cacheKey, result, 43200);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error: any) {
        console.error('WakaTime Timeline API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch WakaTime stats',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
