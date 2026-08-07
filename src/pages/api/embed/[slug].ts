import type { APIRoute } from "astro";
import { db, posts } from "../../../db";
import { renderMarkdown } from "../../../lib/markdown";

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  try {
    const allPosts = await db.query.posts.findMany();
    const post = allPosts.find((p: any) => p.slug === slug);
    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    const { html } = await renderMarkdown(post.content);
    const title = post.title;
    const description = post.description;

    const embedHtml = `
      <div class="embed-header">
        <a href="/posts/${slug}" class="embed-title">${title}</a>
        ${description ? `<p class="embed-description">${description}</p>` : ""}
      </div>
      <div class="embed-body">${html}</div>
    `;

    return new Response(embedHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return new Response("Internal error", { status: 500 });
  }
};
