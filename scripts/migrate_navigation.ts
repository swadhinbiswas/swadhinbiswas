import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

const navItems = [
  { label: 'Projects', href: '/projects', external: false, location: 'header', order: 0 },
  { label: 'Experience', href: '/#experience', external: false, location: 'header', order: 1 },
  { label: 'Skills', href: '/#skills', external: false, location: 'header', order: 2 },
  { label: 'Writing', href: '/posts', external: false, location: 'header', order: 3 },
  { label: 'About', href: '/about', external: false, location: 'header', order: 4 },
  { label: 'Contact', href: '/contact', external: false, location: 'header', order: 5 },
  
  // Menu navigation fallbacks
  { label: 'Home', href: '/', external: false, location: 'menu', order: 100 },
  { label: 'Brainstorm', href: 'https://thephonex.notion.site/Notes-2ad8fd44dc51802fbd38cd337776960d', external: true, location: 'menu', order: 101 }
];

async function migrate(dbUrl: string, dbToken: string = '') {
  console.log(`\nCompass 🧭 Migrating navigation items on ${dbUrl}...`);
  const client = createClient({ url: dbUrl, authToken: dbToken });
  const now = new Date().toISOString();
  try {
    await client.execute("DELETE FROM navigation_items;");
    for (const item of navItems) {
      await client.execute({
        sql: "INSERT INTO navigation_items (label, href, external, location, \"order\", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);",
        args: [item.label, item.href, item.external ? 1 : 0, item.location, item.order, now, now]
      });
      console.log(`  Added nav item: ${item.label}`);
    }
    console.log("✅ Navigation migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    client.close();
  }
}

async function run() {
  await migrate('file:local.db');
  if (url) {
    await migrate(url, token);
  }
}

run();
