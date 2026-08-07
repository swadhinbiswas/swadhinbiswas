// Complete Turso schema sync + seed — idempotent, safe to run multiple times.
// Syncs `projects` to the current schema, creates taxonomy/uses tables,
// seeds terminal bio keys, nav, and site text.
// Usage: bun run scripts/apply-category-migration.mjs
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

const log = (msg) => console.log(msg);

async function run(sql, args = []) {
  try {
    await client.execute({ sql, args });
    return true;
  } catch (e) {
    const msg = e?.message || String(e);
    if (/duplicate column|already exists|already exist/i.test(msg)) {
      log(`  SKIP (exists): ${sql.slice(0, 70)}...`);
      return false;
    }
    throw e;
  }
}

// ── 1. Projects schema sync ──
log("── Projects schema sync ──");
const projectCols = [
  ["slug", "text DEFAULT ''"],
  ["category", "text DEFAULT 'data-engineering'"],
  ["tech_stack", "text DEFAULT '[]'"],
  ["demo_url", "text"],
  ["documentation", "text"],
  ["metrics", "text DEFAULT '{}'"],
  ["gallery", "text DEFAULT '[]'"],
  ["team_size", "integer"],
  ["duration", "text"],
  ["role", "text"],
  ["challenges", "text"],
  ["outcomes", "text"],
  ["lessons_learned", "text"],
];
for (const [col, def] of projectCols) {
  await run(`ALTER TABLE \`projects\` ADD COLUMN \`${col}\` ${def}`);
}

// Posts: external article link column (admin-managed writing entries)
await run("ALTER TABLE `posts` ADD COLUMN `external_url` text");

// ── 2. Backfill slugs + categories ──
log("── Backfill slugs & categories ──");
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const guessCategory = (name, tags) => {
  const n = String(name || "").toLowerCase();
  const t = String(tags || "").toLowerCase();
  if (/(opencodehub|open.?code|github.?alt|open.?source|oss)/.test(n + " " + t)) return "open-source";
  if (/(linux|rust|cli|terminal|shell|appimage|installer)/.test(n + " " + t)) return "cli-tools";
  if (/(chrome|extension|grammarly|browser)/.test(n + " " + t)) return "web";
  if (/(ai|ml|llm|model|bot|chat|vision|nlp|deep)/.test(n + " " + t)) return "ai-ml";
  if (/(pipeline|kafka|spark|airflow|dbt|warehouse|stream)/.test(n + " " + t)) return "data-engineering";
  if (/(k8s|kubernetes|docker|terraform|aws|gcp|devops|infra)/.test(n + " " + t)) return "devops";
  return "data-engineering";
};

const projects = await client.execute("SELECT id, name, slug, category, tags FROM projects ORDER BY id");
for (const p of projects.rows) {
  const slug = p.slug ? String(p.slug) : "";
  const cat = p.category ? String(p.category) : "";
  if (!slug) {
    await run("UPDATE projects SET slug = ? WHERE id = ?", [slugify(p.name), p.id]);
    log(`  slug backfilled: ${p.name} -> ${slugify(p.name)}`);
  }
  if (!cat || cat === "data-engineering" && String(p.name).toLowerCase() !== "live attendance with anti-cheat") {
    const guessed = guessCategory(p.name, p.tags);
    if (guessed !== cat) {
      await run("UPDATE projects SET category = ? WHERE id = ?", [guessed, p.id]);
      log(`  category: ${p.name} -> ${guessed}`);
    }
  }
}

// Unique slug index
await run("CREATE UNIQUE INDEX IF NOT EXISTS `projects_slug_unique` ON \`projects\` (`slug`)");

// Repair malformed JSON in JSON columns (bare-word lists → valid JSON)
log("── Repair malformed JSON ──");
const badJson = await client.execute(
  "SELECT id, name, tags, tech_stack FROM projects WHERE tags NOT LIKE '[%' OR tech_stack NOT LIKE '[%'"
);
for (const p of badJson.rows) {
  const fixList = (v) => {
    if (!v) return null;
    try { JSON.parse(v); return null; }
    catch {
      return JSON.stringify(String(v).split(",").map((s) => s.trim()).filter(Boolean));
    }
  };
  const tags = fixList(p.tags);
  const stack = fixList(p.tech_stack);
  if (tags) { await run("UPDATE projects SET tags = ? WHERE id = ?", [tags, p.id]); log(`  fixed tags: ${p.name}`); }
  if (stack) { await run("UPDATE projects SET tech_stack = ? WHERE id = ?", [stack, p.id]); log(`  fixed tech_stack: ${p.name}`); }
}

// ── 3. project_categories + uses tables & seed ──
log("── Categories & uses ──");
await run(`CREATE TABLE IF NOT EXISTS \`project_categories\` (
  \`slug\` text PRIMARY KEY NOT NULL,
  \`label\` text NOT NULL,
  \`short\` text NOT NULL DEFAULT '',
  \`description\` text NOT NULL DEFAULT '',
  \`order\` integer DEFAULT 0,
  \`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
  \`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
)`);
await run(`CREATE TABLE IF NOT EXISTS \`uses\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`category\` text NOT NULL DEFAULT 'General',
  \`item\` text NOT NULL,
  \`order\` integer DEFAULT 0,
  \`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
  \`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
)`);

const categories = [
  ["data-engineering", "Data Engineering", "Pipelines, warehouses & streaming", "Data pipelines, warehouses, streaming, orchestration and analytics infrastructure.", 1],
  ["web", "Web", "Apps, platforms & APIs", "Production web applications, APIs, real-time platforms and developer experiences.", 2],
  ["cli-tools", "CLI Tools", "Terminal-first developer tools", "Command-line tools, automations and terminal-first developer utilities.", 3],
  ["ai-ml", "AI / ML", "Models, MLOps & applied AI", "Applied machine learning, deep learning systems and MLOps infrastructure.", 4],
  ["devops", "DevOps & Cloud", "Infrastructure, IaC & observability", "Infrastructure as code, Kubernetes, CI/CD, monitoring and cloud architecture.", 5],
  ["open-source", "Open Source", "Public tools & ecosystems", "Open source software, community tooling and public ecosystems.", 6],
  ["research", "Research", "Papers, benchmarks & prototypes", "Research systems, benchmarks, and applied academic prototypes.", 7],
];
for (const [slug, label, short, desc, ord] of categories) {
  await run("INSERT OR IGNORE INTO project_categories (slug, label, short, description, `order`) VALUES (?, ?, ?, ?, ?)", [slug, label, short, desc, ord]);
}
log(`  ${categories.length} categories ensured`);

const usesData = [
  ["Languages", ["Python", "TypeScript", "JavaScript", "Go", "Rust", "SQL", "Bash"]],
  ["Backend", ["FastAPI", "Django", "Node.js", "Express", "Flask", "gRPC", "REST"]],
  ["AI / ML", ["PyTorch", "TensorFlow", "LangChain", "Hugging Face", "scikit-learn"]],
  ["Data", ["Apache Spark", "Apache Kafka", "Apache Airflow", "dbt", "Snowflake", "BigQuery"]],
  ["Database", ["PostgreSQL", "MongoDB", "Redis", "SQLite", "Turso (libSQL)", "Elasticsearch"]],
  ["Infrastructure", ["Docker", "Kubernetes", "AWS", "GCP", "Vercel", "Cloudflare", "Nginx"]],
  ["DevOps", ["GitHub Actions", "CI/CD", "Terraform", "Ansible", "Prometheus", "Grafana"]],
  ["Editor", ["Neovim (primary)", "VS Code", "JetBrains"]],
];
let usesCount = 0;
for (const [cat, items] of usesData) {
  for (let i = 0; i < items.length; i++) {
    const exists = await client.execute({ sql: "SELECT id FROM uses WHERE category = ? AND item = ? LIMIT 1", args: [cat, items[i]] });
    if (exists.rows.length === 0) {
      await client.execute({ sql: "INSERT INTO uses (category, item, `order`) VALUES (?, ?, ?)", args: [cat, items[i], i] });
      usesCount++;
    }
  }
}
log(`  ${usesCount} uses inserted`);

// ── 4. Terminal bio keys ──
log("── Bio terminal keys ──");
const bioKeys = [
  ["currentFocus", "Data Engineering · MLOps · AI Systems · Open Source"],
  ["currentlyBuilding", "OPNCODEHUB — Open-source developer tools and ecosystems"],
  ["seeking", "EU Relocation · Germany · Netherlands · Austria"],
  ["availability", "Open to Mid-level Data/Backend Roles"],
];
for (const [key, value] of bioKeys) {
  const exists = await client.execute({ sql: "SELECT id FROM bio_content WHERE `key` = ? LIMIT 1", args: [key] });
  if (exists.rows.length === 0) {
    await client.execute({ sql: "INSERT INTO bio_content (`key`, value) VALUES (?, ?)", args: [key, value] });
    log(`  added bio: ${key}`);
  }
}

// ── 5. Nav cleanup (anchors → pages) ──
log("── Nav sync ──");
const navFix = [
  ["Experience", "/#experience", "/experience"],
  ["Skills", "/#skills", "/skills"],
  ["Blog", "/#writing", "/posts"],
];
for (const [label, oldHref, newHref] of navFix) {
  const exists = await client.execute({ sql: "SELECT id FROM navigation_items WHERE label = ? AND href = ? AND location = 'header' LIMIT 1", args: [label, newHref] });
  if (exists.rows.length === 0) {
    await run("UPDATE navigation_items SET href = ? WHERE label = ? AND href = ?", [newHref, label, oldHref]);
    log(`  nav: ${label} ${oldHref} -> ${newHref}`);
  }
}
const navEnsure = [
  ["Home", "/", 1], ["Projects", "/projects", 2], ["Experience", "/experience", 3],
  ["Skills", "/skills", 4], ["Achievements", "/achievements", 5], ["Research", "/research", 6],
  ["Writing", "/posts", 7], ["About", "/about", 8], ["Contact", "/contact", 9],
];
for (const [label, href, ord] of navEnsure) {
  const exists = await client.execute({ sql: "SELECT id FROM navigation_items WHERE label = ? AND href = ? AND location = 'header' LIMIT 1", args: [label, href] });
  if (exists.rows.length === 0) {
    await client.execute({ sql: "INSERT INTO navigation_items (label, href, external, location, `order`) VALUES (?, ?, 0, 'header', ?)", args: [label, href, ord] });
    log(`  nav added: ${label}`);
  }
}

// ── 6. Site text settings ──
log("── Site text ──");
const settings = [
  ["sidebar_tagline", "Data engineering. Backend systems. Handmade web."],
  ["footer_tagline", "Built with Astro · Deployed on Vercel · Carbon-aware"],
  ["contact_blurb", "Best way to reach me is email. I'm interested in backend systems, AI product work, research tooling, and serious technical collaborations."],
  ["uses_philosophy", "I believe in using the right tool for the job — not the trendiest one. Simplicity beats complexity. Reliability beats novelty. And the best code is the code you don't have to write.\n\nMy setup prioritizes keyboard-driven workflows, minimalism, and reproducibility."],
  ["blog_url", "https://blog.swadhin.cv"],
  ["notice_period", "30 days"],
  ["work_authorization", "Open to relocation; requires work visa sponsorship in the EU"],
  ["relocation_targets", "Germany · Netherlands · Austria · Remote EU"],
  ["english_level", "English — professional working proficiency (C1)"],
  ["meeting_url", "https://cal.com/swadhinbiswas"],
  ["availability_hours", "Available 8am–12pm CET daily for calls"],
];
for (const [key, value] of settings) {
  await run("INSERT OR IGNORE INTO site_settings (`key`, value) VALUES (?, ?)", [key, value]);
}
log(`  ${settings.length} settings ensured`);

// ── 7. Interests: emoji → icon names ──
log("── Interests icons ──");
const interestIcons = [
  ["Open Source", "github"],
  ["Movies", "film"],
  ["Anime", "tv"],
  ["Tech Exploration", "rocket"],
  ["Foodi", "utensils"],
];
for (const [name, icon] of interestIcons) {
  await run("UPDATE interests SET icon = ? WHERE name = ?", [icon, name]);
}
await run("UPDATE interests SET name = 'Food' WHERE name = 'Foodi'");
const iv = await client.execute("SELECT name, icon FROM interests ORDER BY `order`");
for (const r of iv.rows) console.log("  interest:", r.name, "->", r.icon);

// ── 8. Verify ──
log("\n── Verify ──");
const pv = await client.execute("SELECT id, name, slug, category, featured, stars FROM projects ORDER BY id");
for (const r of pv.rows) console.log("  project:", r.name, "| slug:", r.slug, "| cat:", r.category, "| ★", r.stars);
const bv = await client.execute("SELECT `key` FROM bio_content ORDER BY `key`");
console.log("  bio keys:", bv.rows.map((r) => r.key).join(", "));
const nv = await client.execute("SELECT label, href FROM navigation_items WHERE location = 'header' ORDER BY `order`");
console.log("  nav:", nv.rows.map((r) => `${r.label}(${r.href})`).join(", "));
log("\n✅ Turso sync complete.");
