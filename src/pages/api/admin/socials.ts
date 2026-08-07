import type { APIRoute } from 'astro';
import { db, socialLinks } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

// GET all social links
export const GET: APIRoute = async () => {
  try {
    const socials = await db.select().from(socialLinks).orderBy(socialLinks.order);
    return new Response(JSON.stringify({ success: true, data: socials }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get socials error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch socials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST to create new social link
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, url, icon, footer = false, order = 0 } = body;
    
    const now = new Date().toISOString();
    
    const result = await db.insert(socialLinks).values({
      name,
      url,
      icon,
      footer,
      order: Number(order) || 0,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    await purgeSiteCaches();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create social error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create social' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT to update social link
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ success: false, error: 'Valid numeric ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const now = new Date().toISOString();
    const setData: Record<string, any> = { updatedAt: now };
    
    const fields = ['name', 'url', 'icon', 'footer'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    if (body.order !== undefined) setData.order = Number(body.order) || 0;
    
    await db.update(socialLinks)
      .set(setData)
      .where(eq(socialLinks.id, id));
    
    await purgeSiteCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update social error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update social' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE social link
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ success: false, error: 'Valid numeric ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await db.delete(socialLinks).where(eq(socialLinks.id, id));
    
    await purgeSiteCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete social error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete social' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

