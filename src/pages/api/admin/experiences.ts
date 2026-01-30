import type { APIRoute } from 'astro';
import { db, experiences } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all experiences
export const GET: APIRoute = async () => {
  try {
    const exp = await db.select().from(experiences).orderBy(experiences.order);
    return new Response(JSON.stringify({ success: true, data: exp }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get experiences error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch experiences' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST to create new experience
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { company, role, url, companyDescription, logoUrl, startDate, endDate, details, order = 0 } = body;

    const now = new Date().toISOString();

    const result = await db.insert(experiences).values({
      company,
      role,
      url,
      companyDescription,
      logoUrl,
      startDate,
      endDate,
      details,
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create experience error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create experience' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT to update experience
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, company, role, url, companyDescription, logoUrl, startDate, endDate, details, order } = body;

    const now = new Date().toISOString();

    await db.update(experiences)
      .set({ company, role, url, companyDescription, logoUrl, startDate, endDate, details, order, updatedAt: now })
      .where(eq(experiences.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update experience error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update experience' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE experience
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    await db.delete(experiences).where(eq(experiences.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete experience error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete experience' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
