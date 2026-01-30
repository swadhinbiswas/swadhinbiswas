import type { APIRoute } from "astro";
import { db } from "../../db";
import { pageViews } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export const GET: APIRoute = async () => {
    try {
        // Atomically increment the view count and return the new value
        const result = await db
            .update(pageViews)
            .set({
                count: sql`${pageViews.count} + 1`,
                updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(pageViews.id, 1))
            .returning({ count: pageViews.count });

        let newCount = 0;

        if (result.length > 0) {
            newCount = result[0].count ?? 0;
        } else {
            // Initialize if missing (should be covered by seed, but failsafe)
            const inserted = await db
                .insert(pageViews)
                .values({ id: 1, count: 1 })
                .returning({ count: pageViews.count });
            newCount = inserted[0].count ?? 0;
        }

        return new Response(
            JSON.stringify({
                views: newCount,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store, max-age=0", // Ensure fresh count
                },
            }
        );
    } catch (error) {
        console.error("Error updating views:", error);
        return new Response(JSON.stringify({ error: "Failed to update views" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
