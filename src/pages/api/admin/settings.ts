import type { APIRoute } from 'astro';
import { db, siteSettings } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all settings
export const GET: APIRoute = async () => {
  try {
    const settings = await db.select().from(siteSettings);
    
    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    
    return new Response(JSON.stringify({ success: true, data: settingsObj }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST/PUT to update settings
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };
    
    const now = new Date().toISOString();
    
    for (const [key, value] of Object.entries(settings)) {
      // Try to update existing, insert if not exists
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
      
      if (existing.length > 0) {
        await db.update(siteSettings)
          .set({ value, updatedAt: now })
          .where(eq(siteSettings.key, key));
      } else {
        await db.insert(siteSettings).values({
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
    console.error('Update settings error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
