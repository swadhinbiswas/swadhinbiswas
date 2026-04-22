import { db, posts, projects } from "../db";
import { and, desc, eq, gte, or } from "drizzle-orm";
import { getDynamicConfig } from "../lib/config";

export const prerender = false;

const MAX_NEWS_ITEMS = 1000;
const NEWS_WINDOW_HOURS = 48;

export async function GET() {
  const siteConfig = await getDynamicConfig();
  const siteUrl = (siteConfig.url || "https://swadhin.cv").replace(/\/$/, "");
  const publicationName = siteConfig.name || siteConfig.author || "Swadhin Biswas";

  const now = new Date();
  const windowStart = new Date(now.getTime() - NEWS_WINDOW_HOURS * 60 * 60 * 1000);
  const windowStartEpochMs = windowStart.getTime();

  const [blogPosts, portfolioProjects] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(and(eq(posts.draft, false), gte(posts.publishedAt, windowStart)))
      .orderBy(desc(posts.publishedAt))
      .limit(MAX_NEWS_ITEMS),
    db
      .select()
      .from(projects)
      .where(
        or(
          gte(projects.createdAt, windowStart.toISOString()),
          gte(projects.updatedAt, windowStart.toISOString()),
          gte(projects.projectDate, windowStart.toISOString()),
        ),
      )
      .orderBy(desc(projects.updatedAt), desc(projects.createdAt))
      .limit(MAX_NEWS_ITEMS),
  ]);

  const postEntries = blogPosts.map((post) => {
    const publishedDate = toISOStringSafe(post.publishedAt, now);
    const tags = parseTagList(post.tags);

    return {
      loc: `${siteUrl}/posts/${post.slug}/`,
      publishedDate,
      title: post.title,
      keywords: tags,
    };
  });

  const projectEntries = portfolioProjects.map((project) => {
    const publishedDate = resolveProjectPublishedDate(project, windowStartEpochMs, now);
    const tags = parseTagList(project.tags);

    return {
      loc: `${siteUrl}/projects/${slugify(project.name)}/`,
      publishedDate,
      title: project.name,
      keywords: tags,
    };
  });

  const entries = [...postEntries, ...projectEntries]
    .sort((a, b) => {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    })
    .slice(0, MAX_NEWS_ITEMS);

  const urls = entries.map((entry) => {
    const keywordsXml = entry.keywords.length
      ? `\n      <news:keywords>${escapeXml(entry.keywords.join(", "))}</news:keywords>`
      : "";

    return `
  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.publishedDate}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(publicationName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${entry.publishedDate}</news:publication_date>
      <news:title>${escapeXml(entry.title)}</news:title>${keywordsXml}
    </news:news>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls.join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}

function resolveProjectPublishedDate(
  project: {
    projectDate: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    tags: string | null;
  },
  windowStartEpochMs: number,
  fallbackDate: Date,
) {
  const candidates = [project.projectDate, project.createdAt, project.updatedAt]
    .map(parseDateSafe)
    .filter((date): date is Date => Boolean(date));

  const withinWindow = candidates.find((date) => date.getTime() >= windowStartEpochMs);
  return (withinWindow || candidates[0] || fallbackDate).toISOString();
}

function parseDateSafe(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTagList(rawTags: string | null) {
  if (!rawTags) return [];

  try {
    const parsed = JSON.parse(rawTags);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function toISOStringSafe(value: Date | null, fallbackDate: Date) {
  if (!value) return fallbackDate.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallbackDate.toISOString() : parsed.toISOString();
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
