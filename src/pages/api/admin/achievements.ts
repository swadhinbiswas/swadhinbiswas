import type { APIRoute } from 'astro';
import { db, achievements } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all achievements
export const GET: APIRoute = async () => {
  try {
    const achievementsList = await db.select().from(achievements).orderBy(achievements.order);
    return new Response(JSON.stringify({ success: true, data: achievementsList }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch achievements' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST to create new achievement
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, icon, description, order = 0 } = body;
    
    const now = new Date().toISOString();
    
    const result = await db.insert(achievements).values({
      name,
      icon,
      description,
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create achievement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT to update achievement
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, icon, description, order } = body;
    
    const now = new Date().toISOString();
    
    await db.update(achievements)
      .set({ name, icon, description, order, updatedAt: now })
      .where(eq(achievements.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update achievement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE achievement
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    await db.delete(achievements).where(eq(achievements.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete achievement error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete achievement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
