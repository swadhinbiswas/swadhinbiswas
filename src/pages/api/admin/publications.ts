import type { APIRoute } from 'astro';
import { db, publications } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET all publications
export const GET: APIRoute = async () => {
    try {
        const list = await db.select().from(publications).orderBy(publications.order);
        return new Response(JSON.stringify({ success: true, data: list }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Get publications error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch publications' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// POST to create new publication
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { title, url, venue, date, description, order = 0 } = body;

        const now = new Date().toISOString();

        const result = await db.insert(publications).values({
            title,
            url,
            venue,
            date,
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
        console.error('Create publication error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create publication' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// PUT to update publication
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { id, title, url, venue, date, description, order } = body;

        const now = new Date().toISOString();

        await db.update(publications)
            .set({ title, url, venue, date, description, order, updatedAt: now })
            .where(eq(publications.id, id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Update publication error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update publication' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// DELETE publication
export const DELETE: APIRoute = async ({ request }) => {
    try {
        const { id } = await request.json();

        await db.delete(publications).where(eq(publications.id, id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Delete publication error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete publication' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
