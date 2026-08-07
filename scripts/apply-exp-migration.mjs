import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("TURSO_DATABASE_URL not set"); process.exit(1); }

const client = createClient({ url, authToken });

const statements = [
  `ALTER TABLE experiences ADD COLUMN responsibilities text`,
  `ALTER TABLE experiences ADD COLUMN learnings text`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log(`✅ ${sql}`);
  } catch (e) {
    const msg = e.message || "";
    if (msg.includes("duplicate column")) {
      console.log(`⏭️  Already exists: ${sql}`);
    } else {
      console.error(`❌ ${sql}: ${msg}`);
    }
  }
}

console.log("Done.");
process.exit(0);
