import { defineMiddleware } from 'astro:middleware';
import { db, adminSessions } from './db';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only protect admin routes (except login)
  if (pathname.startsWith('/cat') && !pathname.startsWith('/cat/login')) {
    const sessionToken = context.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return context.redirect('/cat/login');
    }

    try {
      // Verify session in database
      const now = new Date().toISOString();
      const sessions = await db
        .select()
        .from(adminSessions)
        .where(eq(adminSessions.sessionToken, sessionToken))
        .limit(1);

      const session = sessions[0];

      if (!session || session.expiresAt < now) {
        // Invalid or expired session
        context.cookies.delete('admin_session', { path: '/' });
        return context.redirect('/cat/login');
      }

      // Session is valid, continue
      context.locals.isAdmin = true;
    } catch (error) {
      console.error('Auth middleware error:', error);
      // If database error, allow through but mark as not admin
      // This allows the site to work even if DB is not configured
      context.locals.isAdmin = false;
    }
  }

  return next();
});
