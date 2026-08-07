// Seed hero_metrics rows so the "At a Glance" grid renders.
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const rows = [
  { label: "Users Impacted",    value: "1M+",       sub: "Boringrats: built, scaled, acquired", order: 0 },
  { label: "Acquired '25",      value: "1×",        sub: "Boringrats — acquired Nov 2025",      order: 1 },
  { label: "Production Years",  value: "3+ yrs",    sub: "Data pipelines & ML infra",            order: 2 },
  { label: "Open Source",       value: "12+ repos", sub: "Active contributor",                  order: 3 },
];

// Clear existing rows so re-running is idempotent.
await client.execute("DELETE FROM hero_metrics");
for (const r of rows) {
  await client.execute({
    sql: "INSERT INTO hero_metrics (label, value, sub, \"order\", created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    args: [r.label, r.value, r.sub, r.order],
  });
}

const r = await client.execute("SELECT label, value, sub FROM hero_metrics ORDER BY \"order\"");
console.log("hero_metrics now has", r.rows.length, "rows:");
for (const row of r.rows) console.log("  -", row.label, "·", row.value, "·", row.sub);
