import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("admin_session", { path: "/" });
  return redirect("/cat/login");
};
