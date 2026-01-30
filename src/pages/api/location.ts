import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        // Get client IP from Cloudflare headers if available, or fetch from ip-api
        // Since we want the user's location, calling ip-api from the server might return the server's location
        // unless we pass the IP. However, strictly speaking, ip-api.com returns the caller's IP info.
        // If we call it from the server (Cloudflare Worker), it will return the Worker's location.
        // We need to pass the client's IP content if we want their location.

        // Cloudflare provides 'CF-Connecting-IP' header
        const clientIp = request.headers.get('CF-Connecting-IP');

        const apiUrl = clientIp
            ? `http://ip-api.com/json/${clientIp}?fields=lat,lon,city`
            : 'http://ip-api.com/json/?fields=lat,lon,city';

        const response = await fetch(apiUrl);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch location' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
