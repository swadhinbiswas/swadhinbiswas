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
            try {
                await db.insert(clicks).values({ id: "global", count: 0 });
            } catch (e) {
                // Ignore unique constraint error if multiple requests race to insert
            }
        }

        return new Response(JSON.stringify({ count }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.warn("[clicks] DB unavailable, returning fallback");
        return new Response(JSON.stringify({ count: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function POST({ request }: APIContext) {
    try {
        await db
            .insert(clicks)
            .values({ id: "global", count: 1 })
            .onConflictDoUpdate({
                target: clicks.id,
                set: { count: sql`${clicks.count} + 1` },
            });

        const updatedResult = await db
            .select()
            .from(clicks)
            .where(eq(clicks.id, "global"));
        const newCount = updatedResult[0]?.count || 0;

        return new Response(JSON.stringify({ count: newCount }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.warn("[clicks] DB unavailable, returning fallback");
        return new Response(JSON.stringify({ count: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
}
