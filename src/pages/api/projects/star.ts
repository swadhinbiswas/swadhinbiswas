import type { APIRoute } from "astro";
import { db, projects } from "../../../db";
import { eq, sql } from "drizzle-orm";
import { clearConfigCache } from "../../../lib/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Project ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await db
      .update(projects)
      .set({ stars: sql`COALESCE(${projects.stars}, 0) + 1` })
      .where(eq(projects.id, id))
      .returning({ stars: projects.stars });

    if (result.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    clearConfigCache();

    return new Response(JSON.stringify({ success: true, stars: result[0].stars }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Star error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
