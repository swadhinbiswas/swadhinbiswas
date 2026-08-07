import type { APIRoute } from 'astro';
import { db, achievements } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(achievements).orderBy(achievements.order);
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch achievements' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, icon, description, url, image, order = 0, story, outcome, year } = body;
    const slug = body.slug || name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    const now = new Date().toISOString();

    const result = await db.insert(achievements).values({ name, slug, icon, description, url, image, story, outcome, year, order, createdAt: now, updatedAt: now }).returning();
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create achievement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const now = new Date().toISOString();
    const setData: Record<string, any> = { updatedAt: now };
    
    const fields = ['name', 'icon', 'description', 'url', 'image', 'order', 'story', 'outcome', 'year', 'slug'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    
    await db.update(achievements).set(setData).where(eq(achievements.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update achievement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(achievements).where(eq(achievements.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete achievement error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete achievement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};