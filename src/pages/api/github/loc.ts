import { db } from '../../../db';
import { apiCache } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        // 1. Try to get the fresh data pushed by today.py from DB
        const dbResult = await db
            .select()
            .from(apiCache)
            .where(eq(apiCache.key, 'github_stat_loc'))
            .get();

        if (dbResult) {
            const locData = JSON.parse(dbResult.data);
            return new Response(JSON.stringify({
                loc: locData[2],
                added: locData[0],
                deleted: locData[1],
                source: 'database'
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

        // 2. Fallback: Fetch the SVG if DB doesn't have it yet
        const username = import.meta.env.PUBLIC_GITHUB || 'swadhinbiswas';
        const response = await fetch(`https://raw.githubusercontent.com/${username}/${username}/main/dark_mode.svg`);

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
            deleted: deletedMatch[1],
            source: 'svg-fallback'
        };

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
