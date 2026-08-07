import type { APIRoute } from 'astro';
import { db, education } from '../../../db';
import { eq } from 'drizzle-orm';
import { purgeSiteCaches } from '../../../lib/config';

export const prerender = false;

async function invalidateEduCache() {
  await purgeSiteCaches();
}

// GET all education
export const GET: APIRoute = async () => {
    try {
        const list = await db.select().from(education).orderBy(education.order);
        return new Response(JSON.stringify({ success: true, data: list }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Get education error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch education' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// POST to create new education
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { institution, degree, startDate, endDate, details, order = 0 } = body;

        const now = new Date().toISOString();

        const result = await db.insert(education).values({
            institution,
            degree,
            startDate,
            endDate,
            details,
            order,
            createdAt: now,
            updatedAt: now,
        }).returning();

        await invalidateEduCache();

        return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Create education error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create education' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// PUT to update education
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
        
        const fields = ['institution', 'degree', 'startDate', 'endDate', 'details', 'order'];
        for (const f of fields) {
            if (body[f] !== undefined) setData[f] = body[f];
        }
        
        await db.update(education)
            .set(setData)
            .where(eq(education.id, id));
        
        await invalidateEduCache();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Update education error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update education' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// DELETE education
export const DELETE: APIRoute = async ({ request }) => {
    try {
        const { id } = await request.json();

        await db.delete(education).where(eq(education.id, id));

        await invalidateEduCache();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Delete education error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete education' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

