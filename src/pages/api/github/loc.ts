
import { getCachedData, setCachedData } from '../../../lib/redis';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        // Try to get from cache first
        const cacheKey = 'github_loc_stats';
        const cached = await getCachedData(cacheKey);

        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=86400' // 24 hours
                }
            });
        }

        // Fetch the SVG
        const response = await fetch('https://raw.githubusercontent.com/swadhinbiswas/swadhinbiswas/main/dark_mode.svg');

        if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`);
        }

        const svgText = await response.text();

        // Extract data using Regex
        // Pattern matches: <tspan ... id="loc_data">4,923,358</tspan>
        const totalMatch = svgText.match(/id="loc_data">([^<]+)<\/tspan>/);
        const addedMatch = svgText.match(/id="loc_add">([^<]+)<\/tspan>/);
        const deletedMatch = svgText.match(/id="loc_del">([^<]+)<\/tspan>/);

        if (!totalMatch || !addedMatch || !deletedMatch) {
            throw new Error('Failed to parse LOC data from SVG');
        }

        const data = {
            loc: totalMatch[1],
            added: addedMatch[1],
            deleted: deletedMatch[1]
        };

        // Cache the result for 24 hours
        await setCachedData(cacheKey, data, 86400);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error: any) {
        console.error('LOC API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch LOC stats',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
