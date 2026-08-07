// Apply the missing migration directly to Turso
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS \`hero_metrics\` (
     \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
     \`label\` text NOT NULL,
     \`value\` text NOT NULL,
     \`sub\` text NOT NULL,
     \`order\` integer DEFAULT 0,
     \`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
     \`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
   )`,
  `CREATE TABLE IF NOT EXISTS \`testimonials\` (
     \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
     \`quote\` text NOT NULL,
     \`name\` text NOT NULL,
     \`role\` text NOT NULL,
     \`order\` integer DEFAULT 0,
     \`created_at\` text DEFAULT 'CURRENT_TIMESTAMP',
     \`updated_at\` text DEFAULT 'CURRENT_TIMESTAMP'
   )`,
  `ALTER TABLE \`skills\` ADD COLUMN \`description\` text`,
  `ALTER TABLE \`skills\` ADD COLUMN \`used_in\` text`,
  `ALTER TABLE \`skills\` ADD COLUMN \`tier\` text DEFAULT 'core'`,
  `ALTER TABLE \`support_options\` ADD COLUMN \`order\` integer DEFAULT 0`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log("OK:", sql.slice(0, 60) + "...");
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)) || "";
    if (/duplicate column|already exists/i.test(msg)) {
      console.log("SKIP (already exists):", sql.slice(0, 60) + "...");
    } else {
      console.error("ERR:", sql.slice(0, 60), "->", msg);
    }
  }
}

const r = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log("\nTables now in DB:");
for (const row of r.rows) console.log("  -", row.name);
