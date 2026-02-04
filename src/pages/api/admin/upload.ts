import type { APIRoute } from 'astro';
import { uploadImage } from '../../../lib/storage';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { file } = body;

        if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
        }

        const result = await uploadImage(file, {
            folder: 'portfolio/support_qr',
            resource_type: 'image'
        });

        if (result.success) {
            return new Response(JSON.stringify({ success: true, url: result.url }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: result.error }), { status: 500 });
        }

    } catch (error) {
        console.error('Upload API error:', error);
        return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
    }
};
