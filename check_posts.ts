
import { db } from './src/db/index';
import { posts } from './src/db/schema';

async function main() {
    try {
        const allPosts = await db.query.posts.findMany();
        console.log("Found posts:", allPosts.length);
        for (const p of allPosts) {
            console.log(`\n--- Post: ${p.slug} ---`);
            console.log(`Title: ${p.title}`);
            console.log(`Content:\n${p.content}`);
        }
    } catch (e) {
        console.error(e);
    }
}

main();
