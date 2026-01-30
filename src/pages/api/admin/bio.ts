import type { APIRoute } from 'astro';
import { db, bioContent } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all bio content
export const GET: APIRoute = async () => {
  try {
    const bio = await db.select().from(bioContent);
    
    // Convert to key-value object
    const bioObj: Record<string, string> = {};
    bio.forEach(b => {
      bioObj[b.key] = b.value;
    });
    
    return new Response(JSON.stringify({ success: true, data: bioObj }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get bio error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch bio' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST to update bio content
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { bio } = body as { bio: Record<string, string> };
    
    const now = new Date().toISOString();
    
    for (const [key, value] of Object.entries(bio)) {
      const existing = await db.select().from(bioContent).where(eq(bioContent.key, key)).limit(1);
      
      if (existing.length > 0) {
        await db.update(bioContent)
          .set({ value, updatedAt: now })
          .where(eq(bioContent.key, key));
      } else {
        await db.insert(bioContent).values({
          key,
          value,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update bio error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update bio' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
