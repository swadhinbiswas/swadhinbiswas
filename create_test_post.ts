
import { db } from './src/db/index';
import { posts } from './src/db/schema';

async function main() {
    try {
        await db.insert(posts).values({
            slug: 'test-markdown-render',
            title: 'Test Markdown Render',
            description: 'Testing math and mermaid',
            content: `
# Test Post

Here is some inline math: $a^2 + b^2 = c^2$.

Here is a block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Here is a mermaid diagram:
\`\`\`mermaid
graph TD;
    A[Start] --> B{Is it working?};
    B -- Yes --> C[Great!];
    B -- No --> D[Debug];
\`\`\`
            `,
            publishedAt: new Date(),
            tags: JSON.stringify(['test', 'debug']),
            draft: false
        });
        console.log("Test post created.");
    } catch (e) {
        console.error("Error creating post:", e);
    }
}

main();
