import type { APIRoute } from 'astro';
import { db, skills } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all skills
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

// POST to create new skill
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, category = 'general', order = 0 } = body;
    
    const now = new Date().toISOString();
    
    const result = await db.insert(skills).values({
      name,
      category,
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
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

// PUT to update skill
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, category, order } = body;
    
    const now = new Date().toISOString();
    
    await db.update(skills)
      .set({ name, category, order, updatedAt: now })
      .where(eq(skills.id, id));
    
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

// DELETE skill
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    await db.delete(skills).where(eq(skills.id, id));
    
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
