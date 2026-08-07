import type { APIRoute } from "astro";
import { db, posts } from "../../../../db";
import { eq } from "drizzle-orm";
import { ogSvg } from "../../../../lib/og";

export const prerender = false;

// Branded per-post OG image (SVG) — for posts rendered on this site
export const GET: APIRoute = async ({ params }) => {
  const raw = params.slug || "";
  const slug = raw.replace(/\.svg$/, "");
  if (!slug) return new Response("Not found", { status: 404 });

  let post: any = null;
  try {
    const rows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
    post = rows[0] || null;
  } catch {}
  if (!post) return new Response("Not found", { status: 404 });

  const tags = (() => { try { return JSON.parse(post.tags || "[]") as string[]; } catch { return []; } })();

  const svg = ogSvg({
    kicker: "Blog",
    title: post.title,
    description: post.description || "",
    meta: [
      new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      "swadhin.cv",
    ],
    tags,
    footer: "Swadhin Biswas · Data / Backend Engineer · swadhin.cv",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
};
