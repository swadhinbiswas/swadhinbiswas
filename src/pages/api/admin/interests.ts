import type { APIRoute } from 'astro';
import { db, interests } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all interests
export const GET: APIRoute = async () => {
    try {
        const list = await db.select().from(interests).orderBy(interests.order);
        return new Response(JSON.stringify({ success: true, data: list }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Get interests error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch interests' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// POST to create new interest
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { name, category, description, icon, order = 0 } = body;

        const now = new Date().toISOString();

        const result = await db.insert(interests).values({
            name,
            category,
            description,
            icon,
            order,
            createdAt: now,
            updatedAt: now,
        }).returning();

        return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Create interest error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create interest' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// PUT to update interest
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { id, name, category, description, icon, order } = body;

        const now = new Date().toISOString();

        await db.update(interests)
            .set({ name, category, description, icon, order, updatedAt: now })
            .where(eq(interests.id, id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Update interest error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update interest' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// DELETE interest
export const DELETE: APIRoute = async ({ request }) => {
    try {
        const { id } = await request.json();

        await db.delete(interests).where(eq(interests.id, id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Delete interest error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete interest' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
