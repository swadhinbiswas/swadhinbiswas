import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { db, posts } from '../db';
import { sql } from 'drizzle-orm';

const postsDir = path.join(process.cwd(), 'src/content/posts');

async function migrate() {
    console.log('Starting migration from', postsDir);

    if (!fs.existsSync(postsDir)) {
        console.log('No posts directory found.');
        return;
    }

    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
        const filePath = path.join(postsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        const slug = file.replace('.md', '');

        console.log(`Migrating ${slug}...`);

        try {
            await db.insert(posts).values({
                slug: slug,
                title: data.title,
                description: data.description || '',
                content: content,
                publishedAt: new Date(data.publishedAt),
                updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                tags: JSON.stringify(data.tags || []),
                draft: data.draft || false,
            }).onConflictDoUpdate({
                target: posts.slug,
                set: {
                    title: data.title,
                    description: data.description,
                    content: content,
                    publishedAt: new Date(data.publishedAt),
                    updatedAt: new Date(),
                    tags: JSON.stringify(data.tags || []),
                    draft: data.draft || false,
                }
            });
        } catch (e) {
            console.error(`Failed to migrate ${slug}:`, e);
        }
    }
    console.log('Migration complete.');
    process.exit(0);
}

migrate();
