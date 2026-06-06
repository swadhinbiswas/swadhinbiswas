import { defineMiddleware } from 'astro:middleware';

const PUBLIC_ROUTES = ['/cat/login', '/api/cat/login'];

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const path = url.pathname;
  
  // Only protect /cat routes
  if (path.startsWith('/cat') && !PUBLIC_ROUTES.includes(path)) {
    const session = cookies.get("admin_session");
    
    if (!session || session.value !== "authenticated") {
      return redirect("/cat/login");
    }
  }
  
  return next();
});
