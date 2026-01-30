import { db, posts, projects } from '../db';
import { desc, eq, gt } from 'drizzle-orm';
import { siteConfig } from '../config/site';

export async function GET(context: any) {
  // Google News Sitemaps should contain URLs for articles published in the last 2 days.
  // However, for smaller sites, Google often accepts older ones or we can list recent 1000.
  // Let's explicitly fetch recent posts (e.g., last 90 days to be safe and populous).

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000 * 30); // Extended window for portfolio sites

  const blogPosts = await db.select().from(posts)
    .where(eq(posts.draft, false))
    // .where(gt(posts.publishedAt, twoDaysAgo.toISOString())) // Uncomment for strict News compliance
    .orderBy(desc(posts.publishedAt))
    .limit(100);

  const portfolioProjects = await db.select().from(projects)
    // .where(gt(projects.createdAt, twoDaysAgo.toISOString()))
    .orderBy(desc(projects.order))
    .limit(50);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${blogPosts.map(post => `
  <url>
    <loc>${siteConfig.url}/blog/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${siteConfig.name}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(post.publishedAt || now).toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>
  `).join('')}
  ${portfolioProjects.map(proj => `
  <url>
    <loc>${siteConfig.url}/projects/${slugify(proj.name)}</loc>
    <news:news>
      <news:publication>
        <news:name>${siteConfig.name}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(proj.createdAt || now).toISOString()}</news:publication_date>
      <news:title>${escapeXml(proj.name)}</news:title>
    </news:news>
  </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}
