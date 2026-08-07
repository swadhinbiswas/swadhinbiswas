import type { APIRoute } from "astro";
import { db, posts } from "../../../db";
import { desc, eq } from "drizzle-orm";

export const prerender = false;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const GET: APIRoute = async () => {
  try {
    const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt));
    const withTags = rows.map((p) => {
      let tags: string[] = [];
      try { tags = JSON.parse(p.tags || "[]"); } catch {}
      return { ...p, tags };
    });
    return new Response(JSON.stringify({ success: true, data: withTags }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch posts" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, description, content = "", externalUrl, tags = [], draft = false } = body;
    if (!title) {
      return new Response(JSON.stringify({ success: false, error: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const slug = body.slug || slugify(title);
    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
    const now = new Date();

    const result = await db
      .insert(posts)
      .values({
        slug,
        title,
        description: description || "",
        content: content || "",
        externalUrl: externalUrl || null,
        publishedAt,
        updatedAt: now,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        draft: Boolean(draft),
      })
      .returning();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (/unique/i.test(String(error?.message))) {
      return new Response(JSON.stringify({ success: false, error: "A post with this slug already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to create post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug } = body;
    if (!slug) {
      return new Response(JSON.stringify({ success: false, error: "Slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const now = new Date();
    const setData: Record<string, any> = { updatedAt: now };
    const fields = ["title", "description", "content", "externalUrl", "publishedAt", "draft"];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    if (body.tags !== undefined) setData.tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : []);
    if (body.newSlug && body.newSlug !== slug) setData.slug = body.newSlug;

    const result = await db.update(posts).set(setData).where(eq(posts.slug, slug)).returning();
    if (result.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (/unique/i.test(String(error?.message))) {
      return new Response(JSON.stringify({ success: false, error: "A post with this slug already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to update post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();
    await db.delete(posts).where(eq(posts.slug, slug));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to delete post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
