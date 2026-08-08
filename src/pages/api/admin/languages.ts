import type { APIRoute } from 'astro';
import { db, languages } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(languages).orderBy(languages.order);
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch languages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, level = 'learning', note, order = 0 } = body;
    if (!name) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const now = new Date().toISOString();
    const result = await db.insert(languages).values({ name, level, note, order, createdAt: now, updatedAt: now }).returning();
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to create language' }), {
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
    const fields = ['name', 'level', 'note', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    const result = await db.update(languages).set(setData).where(eq(languages.id, id)).returning();
    if (result.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Language not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to update language' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(languages).where(eq(languages.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete language' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
