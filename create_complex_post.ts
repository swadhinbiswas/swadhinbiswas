
import { db } from './src/db/index';
import { posts } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        // Delete existing post if it exists
        await db.delete(posts).where(eq(posts.slug, 'advanced-viz-demo'));

        const content = `
# Advanced Visualizations

Here is a demo of the new visualization components using code blocks.

## Chart.js (Bar Chart)

\`\`\`chart
{
    "type": "bar",
    "data": {
        "labels": ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        "datasets": [{
            "label": "# of Votes",
            "data": [12, 19, 3, 5, 2, 3],
            "backgroundColor": [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)"
            ],
            "borderColor": [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)"
            ],
            "borderWidth": 1
        }]
    }
}
\`\`\`

Some text between visualizations to test the layout.

## Plotly (3D Surface)

\`\`\`plotly
{
    "data": [{
        "z": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
        "type": "surface"
    }],
    "layout": {
        "title": "3D Surface Plot"
    }
}
\`\`\`

## React Flow (Diagram)

\`\`\`flow
{
    "nodes": [
        { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "Start" } },
        { "id": "2", "position": { "x": 0, "y": 100 }, "data": { "label": "Process" } },
        { "id": "3", "position": { "x": 0, "y": 200 }, "data": { "label": "End" } }
    ],
    "edges": [
        { "id": "e1-2", "source": "1", "target": "2" },
        { "id": "e2-3", "source": "2", "target": "3", "animated": true }
    ]
}
\`\`\`

## Conclusion

That's it! You can now embed interactive visualizations in your blog posts.
`;

        await db.insert(posts).values({
            slug: 'advanced-viz-demo',
            title: 'Advanced Visualizations Demo',
            description: 'Testing Chart.js, Plotly, and React Flow with code blocks',
            content: content,
            publishedAt: new Date(),
            tags: JSON.stringify(['viz', 'demo', 'charts']),
            draft: false
        });
        console.log("Post created with code block format.");
    } catch (e) {
        console.error("Error creating post:", e);
    }
}

main();
