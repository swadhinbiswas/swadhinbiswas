import type { APIRoute } from 'astro';
import { db, testimonials } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(testimonials).orderBy(testimonials.order);
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch testimonials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { quote, name, role, order = 0 } = body;
    const now = new Date().toISOString();

    const result = await db.insert(testimonials).values({
      quote, name, role, order,
      createdAt: now, updatedAt: now,
    }).returning();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create testimonial' }), {
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
    
    const fields = ['quote', 'name', 'role', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    
    await db.update(testimonials)
      .set(setData)
      .where(eq(testimonials.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update testimonial' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete testimonial' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};