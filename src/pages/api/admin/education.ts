import type { APIRoute } from 'astro';
import { db, education } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

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
        const { id, institution, degree, startDate, endDate, details, order } = body;

        const now = new Date().toISOString();

        await db.update(education)
            .set({ institution, degree, startDate, endDate, details, order, updatedAt: now })
            .where(eq(education.id, id));

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
