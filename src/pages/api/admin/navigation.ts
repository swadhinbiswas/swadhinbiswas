import type { APIRoute } from 'astro';
import { db, navigationItems } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all navigation items
export const GET: APIRoute = async () => {
  try {
    const navItems = await db.select().from(navigationItems).orderBy(navigationItems.order);
    return new Response(JSON.stringify({ success: true, data: navItems }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get navigation error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch navigation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST to create new navigation item
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { label, href, external = false, location = 'header', order = 0 } = body;
    
    const now = new Date().toISOString();
    
    const result = await db.insert(navigationItems).values({
      label,
      href,
      external,
      location,
      order,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create navigation error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create navigation item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT to update navigation item
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, label, href, external, location, order } = body;
    
    const now = new Date().toISOString();
    
    await db.update(navigationItems)
      .set({ label, href, external, location, order, updatedAt: now })
      .where(eq(navigationItems.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update navigation error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update navigation item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE navigation item
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    await db.delete(navigationItems).where(eq(navigationItems.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete navigation error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete navigation item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
