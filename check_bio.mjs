import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { bioContent, siteSettings } from './src/db/schema.ts';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

const bio = await db.select().from(bioContent).all();
console.log('BIO:', bio);

const settings = await db.select().from(siteSettings).all();
console.log('SETTINGS:', settings);
