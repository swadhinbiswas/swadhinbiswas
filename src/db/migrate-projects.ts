// Migration: Enhance projects table with professional fields
// Run with: bun run src/db/migrate-projects.ts

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';

const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

const db = drizzle(client);

async function migrate() {
  console.log('🔄 Starting projects table migration...\n');

  try {
    // Add new columns to projects table
    const migrations = [
      {
        name: 'tech_stack',
        sql: `ALTER TABLE projects ADD COLUMN tech_stack TEXT DEFAULT '[]'`,
      },
      {
        name: 'architecture',
        sql: `ALTER TABLE projects ADD COLUMN architecture TEXT`,
      },
      {
        name: 'metrics',
        sql: `ALTER TABLE projects ADD COLUMN metrics TEXT DEFAULT '{}'`,
      },
      {
        name: 'gallery',
        sql: `ALTER TABLE projects ADD COLUMN gallery TEXT DEFAULT '[]'`,
      },
      {
        name: 'demo_url',
        sql: `ALTER TABLE projects ADD COLUMN demo_url TEXT`,
      },
      {
        name: 'documentation',
        sql: `ALTER TABLE projects ADD COLUMN documentation TEXT`,
      },
      {
        name: 'team_size',
        sql: `ALTER TABLE projects ADD COLUMN team_size INTEGER`,
      },
      {
        name: 'duration',
        sql: `ALTER TABLE projects ADD COLUMN duration TEXT`,
      },
      {
        name: 'role',
        sql: `ALTER TABLE projects ADD COLUMN role TEXT`,
      },
      {
        name: 'challenges',
        sql: `ALTER TABLE projects ADD COLUMN challenges TEXT`,
      },
      {
        name: 'solutions',
        sql: `ALTER TABLE projects ADD COLUMN solutions TEXT`,
      },
      {
        name: 'outcomes',
        sql: `ALTER TABLE projects ADD COLUMN outcomes TEXT`,
      },
      {
        name: 'lessons_learned',
        sql: `ALTER TABLE projects ADD COLUMN lessons_learned TEXT`,
      },
    ];

    for (const migration of migrations) {
      try {
        await db.run(sql.raw(migration.sql));
        console.log(`  ✅ Added column: ${migration.name}`);
      } catch (error: any) {
        if (error.message?.includes('duplicate column')) {
          console.log(`  ⏭️  Column already exists: ${migration.name}`);
        } else {
          console.error(`  ❌ Failed to add column ${migration.name}:`, error.message);
        }
      }
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
