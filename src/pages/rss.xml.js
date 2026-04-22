import rss from "@astrojs/rss";
import { getDynamicConfig } from "../lib/config";
const siteConfig = await getDynamicConfig();
import { db, posts, projects } from "../db";
import { desc, eq } from "drizzle-orm";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(context) {
  // Fetch published posts
  const blogPosts = await db.select().from(posts).where(eq(posts.draft, false));

  // Fetch projects
  const allProjects = await db.select().from(projects);

  // Combine and standardize
  const items = [
    ...blogPosts.map((post) => ({
      title: post.title,
      pubDate: post.publishedAt,
      description: post.description,
      link: `/blog/${post.slug}/`,
      content: post.content,
    })),
    ...allProjects.map((project) => ({
      title: project.name,
      pubDate: new Date(project.projectDate || project.createdAt || new Date()),
      description: project.description,
      link: `/projects/${slugify(project.name)}/`,
      content: project.description,
    })),
  ];

  // Sort by date descending
  items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site,
    items: items,
    customData: `<language>en-us</language>`,
  });
}
