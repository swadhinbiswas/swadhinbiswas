import rss from "@astrojs/rss";
import { siteConfig } from "../config/site";
import { db, posts, projects } from "../db";
import { desc, eq } from "drizzle-orm";

export async function GET(context) {
    // Fetch published posts
    const blogPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.draft, false));

    // Fetch projects
    const allProjects = await db
        .select()
        .from(projects);

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
            title: `Project: ${project.name}`,
            pubDate: new Date(project.createdAt || new Date()),
            description: project.description,
            link: `/projects/${project.name.toLowerCase().replace(/\s+/g, '-')}/`, // Basic slugify
            content: project.description,
        }))
    ];

    // Sort by date descending
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return rss({
        title: siteConfig.name,
        description: siteConfig.description,
        site: context.site,
        items: items,
        customData: `<language>en-us</language>`,
    });
}
