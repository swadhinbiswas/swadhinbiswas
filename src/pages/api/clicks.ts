export const prerender = false;

import type { APIContext } from "astro";
import { db, clicks } from "../../db";
import { eq, sql } from "drizzle-orm";

export async function GET({ request }: APIContext) {
    try {
        const result = await db.select().from(clicks).where(eq(clicks.id, "global"));
        let count = 0;

        if (result.length > 0) {
            count = result[0].count || 0;
        } else {
            // Initialize if not exists
            try {
                await db.insert(clicks).values({ id: "global", count: 0 });
            } catch (e) {
                // Ignore unique constraint error if multiple requests race to insert
            }
        }

        return new Response(JSON.stringify({ count }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error fetching click count:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch count" }), {
            status: 500,
        });
    }
}

export async function POST({ request }: APIContext) {
    try {
        const result = await db.select().from(clicks).where(eq(clicks.id, "global"));

        if (result.length === 0) {
            try {
                await db.insert(clicks).values({ id: "global", count: 1 });
            } catch (e) {
                // Race condition fallback
                await db
                    .update(clicks)
                    .set({ count: sql`${clicks.count} + 1` })
                    .where(eq(clicks.id, "global"));
            }
        } else {
            await db
                .update(clicks)
                .set({ count: sql`${clicks.count} + 1` })
                .where(eq(clicks.id, "global"));
        }

        const updatedResult = await db
            .select()
            .from(clicks)
            .where(eq(clicks.id, "global"));
        const newCount = updatedResult[0]?.count || 0;

        return new Response(JSON.stringify({ count: newCount }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error incrementing click count:", error);
        return new Response(JSON.stringify({ error: "Failed to increment" }), {
            status: 500,
        });
    }
}
