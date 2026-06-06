import type { APIRoute } from 'astro';

export const prerender = false;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "swadhin2024";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (password === ADMIN_PASSWORD) {
      cookies.set("admin_session", "authenticated", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ success: false, error: "Invalid password" }), {
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
