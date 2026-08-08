import type { APIRoute } from "astro";
import { db, projects } from "../../../db";
import { eq } from "drizzle-orm";
import { purgeSiteCaches, clearConfigCache } from "../../../lib/config";

export const prerender = false;

// Clear projects cache
async function clearProjectsCache() {
  await purgeSiteCaches();
}

// GET all projects
export const GET: APIRoute = async () => {
  try {
    const proj = await db.select().from(projects).orderBy(projects.order);

    // Parse tags from JSON string
    const projectsWithTags = proj.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags || "[]"),
    }));

    return new Response(
      JSON.stringify({ success: true, data: projectsWithTags }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get projects error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch projects" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// POST to create new project
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      content,
      url,
      github,
      image,
      tags = [],
      category = "data-engineering",
      featured = false,
      stars = 0,
      order = 0,
      status = "Active",
      // New fields
      techStack = [],
      demoUrl,
      documentation,
      metrics = {},
      gallery = [],
      teamSize,
      duration,
      role,
      challenges,
      outcomes,
      lessonsLearned,
      projectDate,
    } = body;

    if (!name || !description || !url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Name, description, and URL are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const result = await db
      .insert(projects)
      .values({
        name,
        slug,
        description,
        content: content || "",
        url,
        github: github || null,
        image: image || null,
        tags: JSON.stringify(tags),
        category,
        featured,
        stars,
        order,
        status,
        projectDate: projectDate || null,
        // New fields
        techStack: JSON.stringify(techStack),
        demoUrl: demoUrl || null,
        documentation: documentation || null,
        metrics: JSON.stringify(metrics),
        gallery: JSON.stringify(gallery),
        teamSize: teamSize || null,
        duration: duration || null,
        role: role || null,
        challenges: challenges || null,
        outcomes: outcomes || null,
        lessonsLearned: lessonsLearned || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Clear config cache to force refresh of featured projects
    clearConfigCache();
    await clearProjectsCache();

    return new Response(
      JSON.stringify({ success: true, data: { ...result[0], tags } }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Create project error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to create project" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// PUT to update project
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Project ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();
    const setData: Record<string, any> = { updatedAt: now };

    const fields = [
      'name', 'description', 'content', 'url', 'github', 'image', 'tags', 'category',
      'featured', 'stars', 'order', 'status', 'projectDate',
      // New fields
      'techStack', 'demoUrl', 'documentation', 'metrics', 'gallery',
      'teamSize', 'duration', 'role', 'challenges', 'outcomes', 'lessonsLearned'
    ];
    const jsonFields = ['tags', 'techStack', 'metrics', 'gallery'];
    for (const f of fields) {
      if (body[f] !== undefined) {
        setData[f] = jsonFields.includes(f) ? JSON.stringify(body[f]) : body[f];
      }
    }

    const result = await db
      .update(projects)
      .set(setData)
      .where(eq(projects.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Project not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Clear config cache to force refresh of featured projects
    clearConfigCache();
    await clearProjectsCache();

    return new Response(
      JSON.stringify({ success: true, data: { ...result[0], tags: JSON.parse(result[0].tags || "[]") } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Update project error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update project" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// DELETE project
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    await db.delete(projects).where(eq(projects.id, id));

    // Clear config cache to force refresh of featured projects
    clearConfigCache();
    await clearProjectsCache();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to delete project" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
