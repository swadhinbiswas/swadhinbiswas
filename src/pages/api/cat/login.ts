import type { APIRoute } from 'astro';
import { verifyCredentials, createSession } from '../../../lib/auth';
import { checkAuthRateLimit } from '../../../lib/ratelimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    // Rate limit: 5 attempts per minute per IP
    const { success } = await checkAuthRateLimit(`login:${clientAddress || 'unknown'}`);
    if (!success) {
      return new Response(JSON.stringify({ success: false, error: "Too many attempts. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: "Username and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    if (verifyCredentials(username, password)) {
      const token = await createSession();
      
      cookies.set("admin_session", token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
