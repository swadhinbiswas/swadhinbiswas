import type { APIRoute } from 'astro';
import { db, faqs } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(faqs).orderBy(faqs.order);
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch FAQs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { question, answer, order = 0 } = body;
    if (!question || !answer) {
      return new Response(JSON.stringify({ success: false, error: 'Question and answer are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const now = new Date().toISOString();
    const result = await db.insert(faqs).values({ question, answer, order, createdAt: now, updatedAt: now }).returning();
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to create FAQ' }), {
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
    const fields = ['question', 'answer', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    const result = await db.update(faqs).set(setData).where(eq(faqs.id, id)).returning();
    if (result.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'FAQ not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to update FAQ' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(faqs).where(eq(faqs.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete FAQ' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
