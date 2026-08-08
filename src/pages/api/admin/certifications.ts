import type { APIRoute } from 'astro';
import { db, certifications } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const list = await db.select().from(certifications).orderBy(certifications.order);
    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch certifications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, issuer, year, url, credentialId, order = 0 } = body;
    if (!name || !issuer) {
      return new Response(JSON.stringify({ success: false, error: 'Name and issuer are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const now = new Date().toISOString();
    const result = await db.insert(certifications).values({ name, issuer, year, url, credentialId, order, createdAt: now, updatedAt: now }).returning();
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to create certification' }), {
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
    const fields = ['name', 'issuer', 'year', 'url', 'credentialId', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    const result = await db.update(certifications).set(setData).where(eq(certifications.id, id)).returning();
    if (result.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Certification not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to update certification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    await db.delete(certifications).where(eq(certifications.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete certification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
