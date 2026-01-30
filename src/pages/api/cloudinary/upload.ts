import type { APIRoute } from 'astro';
import { uploadImage } from '../../../lib/cloudinary';

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') as string | null;
        const publicId = formData.get('public_id') as string | null;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let fileData: Buffer | string;

        // Handle different file types
        if (file instanceof File) {
            const arrayBuffer = await file.arrayBuffer();
            fileData = Buffer.from(arrayBuffer);
        } else if (typeof file === 'string') {
            // Data URI
            fileData = file;
        } else {
            return new Response(JSON.stringify({ error: 'Invalid file format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await uploadImage(fileData, {
            folder: folder || 'portfolio',
            public_id: publicId || undefined,
        });

        if (result.success) {
            return new Response(
                JSON.stringify({
                    success: true,
                    url: result.url,
                    public_id: result.public_id,
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        } else {
            return new Response(
                JSON.stringify({ error: result.error || 'Upload failed' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    } catch (error) {
        console.error('Upload API error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Internal server error',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
