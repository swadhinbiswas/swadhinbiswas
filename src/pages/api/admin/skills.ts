import type { APIRoute } from 'astro';
import { db, skills } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const skillsList = await db.select().from(skills).orderBy(skills.order);
    return new Response(JSON.stringify({ success: true, data: skillsList }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get skills error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch skills' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, category = 'general', description = '', usedIn = '', tier = 'core', order = 0 } = body;

    const now = new Date().toISOString();

    const result = await db.insert(skills).values({
      name,
      category,
      description: description || null,
      usedIn: usedIn || null,
      tier,
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();

    await purgeSiteCaches();

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create skill error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create skill' }), {
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
    
    const fields = ['name', 'category', 'description', 'usedIn', 'tier', 'order'];
    for (const f of fields) {
      if (body[f] !== undefined) setData[f] = body[f];
    }
    
    await db.update(skills)
      .set(setData)
      .where(eq(skills.id, id));

    await purgeSiteCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update skill error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update skill' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    await db.delete(skills).where(eq(skills.id, id));

    await purgeSiteCaches();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete skill' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

