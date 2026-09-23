// Attaches cover images and architecture/screenshot galleries to every project,
// and adds a mermaid branch diagram to contexa (the only repo without diagrams).
// Usage: node scripts/seed-project-media.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL not set — aborting.");
  process.exit(1);
}
const client = createClient({ url, authToken });
const raw = (repo, branch, path) =>
  `https://raw.githubusercontent.com/swadhinbiswas/${repo}/${branch}/${path}`;

const media = {
  "eu-air-traffic": {
    cover: raw("eu-air-traffic", "main", "images/eu-air-traffic-cover.svg"),
    gallery: [
      [raw("eu-air-traffic", "main", "images/eu-air-traffic.png"), "Dashboard"],
      [raw("eu-air-traffic", "main", "images/1.png"), "Live airspace map"],
      [raw("eu-air-traffic", "main", "images/aws-version.png"), "AWS serverless extension"],
    ],
  },
  terrasentinel: {
    cover: raw("TerraSentinel", "main", "docs/dashboard.png"),
    gallery: [
      [raw("TerraSentinel", "main", "docs/architecture.svg"), "Pipeline architecture"],
      [raw("TerraSentinel", "main", "docs/dashboard.png"), "Dashboard"],
    ],
  },
  eurostream: {
    cover: raw("eurostream", "master", "assets/eurostream-cover.svg"),
    gallery: [
      [raw("eurostream", "master", "assets/architecture-animated.svg"), "End-to-end architecture"],
      [raw("eurostream", "master", "assets/erasure-cascade.svg"), "Six-layer Article 17 erasure"],
      [raw("eurostream", "master", "assets/medallion-pipeline.svg"), "Medallion pipeline"],
      [raw("eurostream", "master", "assets/fraud-flow-animated.svg"), "Fraud detection flow"],
      [raw("eurostream", "master", "assets/six-layer-transaction.png"), "Erasure transaction"],
    ],
  },
  opencodehub: {
    cover: raw("OpencodeHub", "main", "public/architecture.svg"),
    gallery: [
      [raw("OpencodeHub", "main", "public/architecture.svg"), "System architecture"],
      [raw("OpencodeHub", "main", "public/stack-workflow.svg"), "Stack and workflow"],
    ],
  },
  justapi: {
    cover: raw("JustAPI", "main", "assets/justapi-hero.svg"),
    gallery: [
      [raw("JustAPI", "main", "assets/justapi-pipeline.svg"), "Request pipeline"],
      [raw("JustAPI", "main", "assets/justapi-benchmark.svg"), "Benchmark results"],
      [raw("JustAPI", "main", "assets/justapi-features.png"), "Feature matrix"],
    ],
  },
  aurora: {
    cover: raw("Aurora", "main", "assets/aurora-cover.svg"),
    gallery: [
      [raw("Aurora", "main", "paper/figures/01_architecture_overview.svg"), "Architecture overview"],
      [raw("Aurora", "main", "result/figures/abstention_accuracy.png"), "Abstention vs accuracy"],
      [raw("Aurora", "main", "result/figures/reliability_diagram.png"), "Reliability diagram"],
      [raw("Aurora", "main", "paper/figures/multi-ART.png"), "Multi-ART comparison"],
    ],
  },
  opengrammar: {
    cover: raw("opengrammar", "main", "assets/opengrammar-cover.svg"),
    gallery: [
      [raw("opengrammar", "main", "screenshot-2026-04-22_13.14.06.png"), "Extension in use"],
      [raw("opengrammar", "main", "logo.svg"), "Logo"],
    ],
  },
  aegisvision: {
    cover: raw("AegisVision", "main", "docs/diagrams/architecture.svg"),
    gallery: [
      [raw("AegisVision", "main", "docs/diagrams/architecture.svg"), "System architecture"],
      [raw("AegisVision", "main", "docs/diagrams/recognition-pipeline.svg"), "Recognition pipeline"],
      [raw("AegisVision", "main", "docs/diagrams/data-model.svg"), "Data model"],
      [raw("AegisVision", "main", "docs/diagrams/deployment.svg"), "Deployment"],
      [raw("AegisVision", "main", "photos/faceapp.png"), "Face recognition"],
      [raw("AegisVision", "main", "photos/loginpage.gif"), "Login page"],
    ],
  },
  contexa: {
    cover: raw("contexa", "main", "assets/logo.svg"),
    gallery: [[raw("contexa", "main", "assets/logo.svg"), "Project logo"]],
  },
  ecoguard: {
    cover: raw("Ecoguard", "main", "docs/media/architecture.svg"),
    gallery: [
      [raw("Ecoguard", "main", "docs/media/architecture.svg"), "Layered middleware architecture"],
      [raw("Ecoguard", "main", "docs/media/features.svg"), "Feature overview"],
      [raw("Ecoguard", "main", "docs/media/dashboard-preview.svg"), "Dashboard"],
      [raw("Ecoguard", "main", "docs/media/quickstart.svg"), "Quick-start flow"],
    ],
  },
  veet: {
    cover: raw("veet", "main", "assets/veet-preview.svg"),
    gallery: [
      [raw("veet", "main", "assets/veet-preview.svg"), "TUI preview"],
      [raw("veet", "main", "assets/screenshot.png"), "Scan output"],
    ],
  },
};

for (const [slug, m] of Object.entries(media)) {
  const gallery = m.gallery.map(([src, caption]) => ({ src, caption }));
  const res = await client.execute({
    sql: 'UPDATE projects SET image = ?, gallery = ?, "updated_at" = CURRENT_TIMESTAMP WHERE slug = ?',
    args: [m.cover, JSON.stringify(gallery), slug],
  });
  console.log(`  ${slug.padEnd(16)} image + ${gallery.length} gallery items (rows: ${res.rowsAffected})`);
}

// contexa is the only repo with no diagrams — add a mermaid branch model.
const mermaid = `

## The branch model

\`\`\`mermaid
gitGraph
  commit id: "init"
  commit id: "roadmap"
  branch experiment
  checkout experiment
  commit id: "try A"
  commit id: "try B"
  checkout main
  merge experiment
  commit id: "merged"
\`\`\`
`;
const r = await client.execute({
  sql: "UPDATE projects SET content = content || ? WHERE slug = 'contexa' AND (content IS NULL OR content NOT LIKE '%gitGraph%')",
  args: [mermaid],
});
console.log(`  contexa mermaid diagram added (rows: ${r.rowsAffected})`);

client.close();
console.log("done.");
