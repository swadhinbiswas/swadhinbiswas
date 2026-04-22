import type { APIRoute } from "astro";
import { db } from "../../db";
import { pageViews } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export const GET: APIRoute = async () => {
    try {
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
            const inserted = await db
                .insert(pageViews)
                .values({ id: 1, count: 1 })
                .returning({ count: pageViews.count });
            newCount = inserted[0].count ?? 0;
        }

        return new Response(
            JSON.stringify({ views: newCount }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store, max-age=0",
                },
            }
        );
    } catch (error) {
        console.warn("[views] DB unavailable, returning fallback");
        return new Response(JSON.stringify({ views: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
};
