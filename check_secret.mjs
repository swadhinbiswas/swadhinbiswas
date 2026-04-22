import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { siteSettings } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

const result = await db
  .select()
  .from(siteSettings)
  .where(eq(siteSettings.key, 'github_update_secret'))
  .get();

console.log('Current github_update_secret:', result?.value || 'NOT SET');
