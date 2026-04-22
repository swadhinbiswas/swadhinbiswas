import type { APIRoute } from "astro";
import { db } from "../../../db";
import { apiCache, siteSettings } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const prerender = false;

/**
 * SECURE UPDATE ENDPOINT
 * This endpoint allows today.py to push fresh stats.
 * It verifies a secret key stored in the 'site_settings' table.
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");

        // Fetch the secret key from the database
        const secretSetting = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "github_update_secret"))
            .get();

        const dbSecret = secretSetting?.value;

        // Ensure the secret exists in DB and matches the request header
        if (!dbSecret || authHeader !== `Bearer ${dbSecret}`) {
            console.warn("[update-stats] Unauthorized access attempt or missing secret in DB");
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const body = await request.json();
        const { stats } = body;

        if (!stats) {
            return new Response(JSON.stringify({ error: "Missing stats data" }), { status: 400 });
        }

        const now = Date.now();
        const results = [];

        // We store each stat as a separate key in apiCache
        for (const [key, value] of Object.entries(stats)) {
            const cacheKey = `github_stat_${key}`;
            const jsonValue = JSON.stringify(value);

            await db
                .insert(apiCache)
                .values({
                    key: cacheKey,
                    data: jsonValue,
                    updatedAt: now,
                })
                .onConflictDoUpdate({
                    target: apiCache.key,
                    set: {
                        data: jsonValue,
                        updatedAt: now,
                    },
                });
            
            results.push(cacheKey);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            updated: results,
            timestamp: now 
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("[api/github/update-stats] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
