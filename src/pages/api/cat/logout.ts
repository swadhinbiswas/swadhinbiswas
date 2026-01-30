import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionToken = cookies.get('admin_session')?.value;

  if (sessionToken) {
    try {
      await deleteSession(sessionToken);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  cookies.delete('admin_session', { path: '/' });

  return redirect('/cat/login');
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const sessionToken = cookies.get('admin_session')?.value;

  if (sessionToken) {
    try {
      await deleteSession(sessionToken);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  cookies.delete('admin_session', { path: '/' });

  return redirect('/cat/login');
};
