import type { APIRoute } from "astro";
import { db, projects } from "../../../db";
import { eq } from "drizzle-orm";
import { getProjectCategories } from "../../../lib/projects";
import { ogSvg } from "../../../lib/og";

export const prerender = false;

// Branded per-project OG image (SVG) — Google supports SVG og:image.
export const GET: APIRoute = async ({ params }) => {
  const raw = params.slug || "";
  const slug = raw.replace(/\.svg$/, "");
  if (!slug) return new Response("Not found", { status: 404 });

  let project: any = null;
  try {
    const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
    project = rows[0] || null;
  } catch {}
  if (!project) return new Response("Not found", { status: 404 });

  const categories = await getProjectCategories();
  const cat = categories.find((c) => c.slug === (project.category || "data-engineering"));
  const tags = (() => { try { return JSON.parse(project.tags || "[]") as string[]; } catch { return []; } })();

  const svg = ogSvg({
    kicker: cat?.label || "Project",
    title: project.name,
    description: project.description || "",
    meta: [`★ ${(project.stars || 0).toLocaleString()} stars`, "swadhin.cv"],
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
