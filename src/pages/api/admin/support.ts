import type { APIRoute } from 'astro';
import { db, supportOptions } from '../../../db';
import { eq, asc } from 'drizzle-orm';

export const GET: APIRoute = async () => {
    try {
        const options = await db.select().from(supportOptions).orderBy(asc(supportOptions.order));
        return new Response(JSON.stringify(options), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch support options" }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { name, icon, type, value, qrCode, order } = body;

        await db.insert(supportOptions).values({
            name,
            icon,
            type: type || 'link',
            value,
            qrCode,
            order: order || 0
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to create option" }), { status: 500 });
    }
};

export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { id, name, icon, type, value, qrCode, order } = body;

        await db.update(supportOptions)
            .set({ name, icon, type, value, qrCode, order })
            .where(eq(supportOptions.id, id));

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to update option" }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

        await db.delete(supportOptions).where(eq(supportOptions.id, parseInt(id)));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to delete option" }), { status: 500 });
    }
};
