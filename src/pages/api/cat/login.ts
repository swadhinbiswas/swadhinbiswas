import type { APIRoute } from 'astro';
import { verifyCredentials, createSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    const username = formData.get('username')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (!verifyCredentials(username, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create session
    const sessionToken = await createSession();

    // Set cookie
    cookies.set('admin_session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(JSON.stringify({
      success: true,
      redirect: '/cat'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
