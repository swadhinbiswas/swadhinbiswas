import type { APIRoute } from 'astro';
import { db, projects } from '../../../db';
import { eq, sql } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing Project ID" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const result = await db.update(projects)
            .set({ stars: sql`${projects.stars} + 1` })
            .where(eq(projects.id, id))
            .returning({ stars: projects.stars });

        if (!result.length) {
            return new Response(JSON.stringify({ error: "Project not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true, stars: result[0].stars }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Star error:", error);
        return new Response(JSON.stringify({ error: "Failed to star project" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
