import type { APIRoute } from 'astro';
import { db, experiences } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

async function invalidateExpCache() {
  await purgeSiteCaches();
}

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

function parseJsonField(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { company, role, url, companyDescription, logoUrl, startDate, endDate, details, responsibilities, learnings, order = 0 } = body;

    const now = new Date().toISOString();
    const result = await db.insert(experiences).values({
      company,
      role,
      url: url || '',
      companyDescription: companyDescription || null,
      logoUrl: logoUrl || null,
      startDate,
      endDate: endDate || null,
      details: details || null,
      responsibilities: parseJsonField(responsibilities),
      learnings: parseJsonField(learnings),
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();

    await invalidateExpCache();

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

    const fields = ['company', 'role', 'url', 'companyDescription', 'logoUrl', 'startDate', 'endDate', 'details', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    if (body.responsibilities !== undefined) setData.responsibilities = parseJsonField(body.responsibilities);
    if (body.learnings !== undefined) setData.learnings = parseJsonField(body.learnings);

    await db.update(experiences)
      .set(setData)
      .where(eq(experiences.id, id));

    await invalidateExpCache();

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

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(experiences).where(eq(experiences.id, id));

    await invalidateExpCache();

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

