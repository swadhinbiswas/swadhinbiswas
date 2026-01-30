import type { APIRoute } from 'astro';
import { db, socialLinks } from '../../../db';
import { eq } from 'drizzle-orm';

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
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
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
    const { id, name, url, icon, footer, order } = body;
    
    const now = new Date().toISOString();
    
    await db.update(socialLinks)
      .set({ name, url, icon, footer, order, updatedAt: now })
      .where(eq(socialLinks.id, id));
    
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
    const { id } = await request.json();
    
    await db.delete(socialLinks).where(eq(socialLinks.id, id));
    
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
