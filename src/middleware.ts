import { defineMiddleware } from 'astro:middleware';
import { verifySession } from './lib/auth';

const PUBLIC_ROUTES = ['/cat/login', '/api/cat/login'];

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const path = url.pathname;
  
  // Protect /cat pages and /api/admin endpoints
  const isProtected = (path.startsWith('/cat') || path.startsWith('/api/admin')) && !PUBLIC_ROUTES.includes(path);

  if (isProtected) {
    const sessionCookie = cookies.get("admin_session");
    
    if (!sessionCookie?.value) {
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect("/cat/login");
    }

    const isValid = await verifySession(sessionCookie.value);
    if (!isValid) {
      cookies.delete("admin_session", { path: "/" });
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ success: false, error: 'Session expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect("/cat/login");
    }
  }
  
  return next();
});
