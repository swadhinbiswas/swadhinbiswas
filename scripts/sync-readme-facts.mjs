// Syncs the facts that live in both readme.md and Turso.
//   1. B.Sc. dates: April 2022 to July 2026 (result published July 2026)
//   2. Databricks in the skills list
// Idempotent and safe to run repeatedly.
// Usage: node scripts/sync-readme-facts.mjs
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
const log = (...args) => console.log(...args);

// ── 1. Education dates ──────────────────────────────────────────────
log("── Education ──");
const before = await client.execute(
  "SELECT id, institution, start_date, end_date FROM education WHERE institution LIKE 'Daffodil%' ORDER BY id",
);
for (const row of before.rows) {
  log(`  before: #${row.id} ${row.institution} ${row.start_date} to ${row.end_date}`);
}
const updated = await client.execute({
  sql: "UPDATE education SET start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE institution LIKE 'Daffodil%'",
  args: ["2022-04-01", "2026-07-01"],
});
log(`  rows updated: ${updated.rowsAffected}`);
const after = await client.execute(
  "SELECT id, institution, start_date, end_date FROM education WHERE institution LIKE 'Daffodil%' ORDER BY id",
);
for (const row of after.rows) {
  log(`  after:  #${row.id} ${row.institution} ${row.start_date} to ${row.end_date}`);
}

// ── 2. Databricks skill ─────────────────────────────────────────────
log("── Skills ──");
const existing = await client.execute({
  sql: "SELECT id FROM skills WHERE lower(name) = lower(?)",
  args: ["Databricks"],
});
if (existing.rows.length > 0) {
  log(`  Databricks already present (#${existing.rows[0].id}) — skipped.`);
} else {
  const max = await client.execute(
    'SELECT COALESCE(MAX("order"), 0) AS max_order FROM skills',
  );
  const nextOrder = Number(max.rows[0].max_order) + 1;
  await client.execute({
    sql: 'INSERT INTO skills (name, category, tier, "order", created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    args: ["Databricks", "tool", "core", nextOrder],
  });
  log(`  added Databricks (category=tool, tier=core, order=${nextOrder}).`);
}

client.close();
log("done.");
