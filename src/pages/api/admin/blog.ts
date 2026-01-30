export const prerender = false;


import { type APIRoute } from "astro";
import { db, posts } from "../../../db";
import { eq, desc } from "drizzle-orm";

// GET: List all posts
export const GET: APIRoute = async () => {
    try {
        const dbPosts = await db.select().from(posts).orderBy(desc(posts.publishedAt));

        const mappedPosts = dbPosts.map(p => ({
            slug: p.slug,
            title: p.title,
            description: p.description,
            publishedAt: p.publishedAt,
            tags: JSON.parse(p.tags || '[]'),
            draft: p.draft,
            content: p.content,
        }));

        return new Response(JSON.stringify(mappedPosts), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Fetch API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// POST: Create or Update post
export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const {
            slug,
            originalSlug,
            title,
            description,
            tags,
            content,
            draft,
            publishedAt
        } = data;

        if (!slug || !title) {
            return new Response(JSON.stringify({ error: "Slug and Title are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Prepare data
        const date = publishedAt ? new Date(publishedAt) : new Date();
        const tagsArray = Array.isArray(tags) ? tags : (tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
        const tagsString = JSON.stringify(tagsArray);

        const postData = {
            slug,
            title,
            description: description || '',
            content: content || '',
            publishedAt: date,
            updatedAt: new Date(),
            tags: tagsString,
            draft: Boolean(draft),
        };

        // Handle Rename (slug change)
        if (originalSlug && originalSlug !== slug) {
            // Check if new slug exists to avoid collision? 
            // We can let database constraint handle it or check manually.
            // Ideally: Update if exists, or Insert.

            // If renaming, we should update the existing record if possible, but simplest is Delete Old + Insert New
            // OR Update where slug = originalSlug
            await db.update(posts).set(postData).where(eq(posts.slug, originalSlug));
        } else {
            // Insert or Update (Upsert)
            // On conflict on slug, update
            await db.insert(posts).values(postData).onConflictDoUpdate({
                target: posts.slug,
                set: postData
            });
        }

        return new Response(JSON.stringify({ message: "Post saved successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Save API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to save post: " + (error as any).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// DELETE: Delete post
export const DELETE: APIRoute = async ({ request }) => {
    try {
        const { slug } = await request.json();
        if (!slug) {
            return new Response(JSON.stringify({ error: "Slug is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        await db.delete(posts).where(eq(posts.slug, slug));

        return new Response(JSON.stringify({ message: "Post deleted" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Delete API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete post" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
