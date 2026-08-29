import type { APIRoute } from 'astro';
import { db, workshopProjects } from '../../../db';
import { eq, asc } from 'drizzle-orm';
import { clearLoaderCaches } from '../../../lib/loaders';

export const prerender = false;

// GET all workshop projects
export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(workshopProjects).orderBy(asc(workshopProjects.order));
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get workshop projects error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch workshop projects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST create new workshop project
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      badge = 'Completed',
      timeframe = '1 weekend',
      categoryKey = 'keyboards',
      category = 'Hardware / Peripherals',
      icon = 'cpu',
      summary = '',
      image = '',
      video = '',
      highlights = '[]',
      bom = '[]',
      tools = '[]',
      learnings = '',
      featured = false,
      order = 0,
    } = body;

    if (!title) {
      return new Response(JSON.stringify({ success: false, error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date().toISOString();

    const result = await db.insert(workshopProjects).values({
      slug: cleanSlug,
      title,
      badge,
      timeframe,
      categoryKey,
      category,
      icon,
      summary,
      image: image || null,
      video: video || null,
      highlights: typeof highlights === 'string' ? highlights : JSON.stringify(highlights),
      bom: typeof bom === 'string' ? bom : JSON.stringify(bom),
      tools: typeof tools === 'string' ? tools : JSON.stringify(tools),
      learnings,
      featured: Boolean(featured),
      order: Number(order) || 0,
      createdAt: now,
      updatedAt: now,
    }).returning();

    clearLoaderCaches();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create workshop project error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create workshop project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT update workshop project
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const setData: Record<string, any> = { updatedAt: now };

    const stringFields = [
      'title',
      'slug',
      'badge',
      'timeframe',
      'categoryKey',
      'category',
      'icon',
      'summary',
      'image',
      'video',
      'learnings',
    ];

    for (const f of stringFields) {
      if (body[f] !== undefined) setData[f] = body[f] || null;
    }

    if (body.highlights !== undefined) {
      setData.highlights = typeof body.highlights === 'string' ? body.highlights : JSON.stringify(body.highlights);
    }
    if (body.bom !== undefined) {
      setData.bom = typeof body.bom === 'string' ? body.bom : JSON.stringify(body.bom);
    }
    if (body.tools !== undefined) {
      setData.tools = typeof body.tools === 'string' ? body.tools : JSON.stringify(body.tools);
    }
    if (body.featured !== undefined) {
      setData.featured = Boolean(body.featured);
    }
    if (body.order !== undefined) {
      setData.order = Number(body.order);
    }

    await db.update(workshopProjects).set(setData).where(eq(workshopProjects.id, id));
    clearLoaderCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update workshop project error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update workshop project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE workshop project
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(workshopProjects).where(eq(workshopProjects.id, id));
    clearLoaderCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete workshop project error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete workshop project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
