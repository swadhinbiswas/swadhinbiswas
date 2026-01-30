
import { db } from './src/db/index';
import { posts } from './src/db/schema';

async function main() {
    try {
        const allPosts = await db.query.posts.findMany();
        console.log("Found posts:", allPosts.length);
        for (const p of allPosts) {
            const hasMath = p.content.includes("$$") || p.content.includes("$");
            const hasMermaid = p.content.includes("mermaid");

            if (hasMath || hasMermaid) {
                console.log(`\n--- Post: ${p.slug} ---`);
                console.log(`Has Math: ${hasMath}, Has Mermaid: ${hasMermaid}`);
                console.log("First 500 chars:", p.content.slice(0, 500));
            }
        }
    } catch (e) {
        console.error(e);
    }
}

main();
