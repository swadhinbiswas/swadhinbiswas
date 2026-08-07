import type { APIRoute } from 'astro';
import { db, heroMetrics } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(heroMetrics).orderBy(heroMetrics.order);
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get hero metrics error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch hero metrics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { label, value, sub, order = 0 } = body;
    const now = new Date().toISOString();

    const result = await db.insert(heroMetrics).values({ label, value, sub, order, createdAt: now, updatedAt: now }).returning();
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create metric error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create metric' }), {
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
    
    const fields = ['label', 'value', 'sub', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    
    await db.update(heroMetrics).set(setData).where(eq(heroMetrics.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update metric error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update metric' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(heroMetrics).where(eq(heroMetrics.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete metric error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete metric' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};