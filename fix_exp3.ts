import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { experiences } from './src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

const db = drizzle(client);

async function main() {
  await db.update(experiences).set({
    role: 'DATA/ Backend Engineer & Co-founder',
    details: 'Data Engineer & Tech Lead (Boringrats, acquired). Scaled infrastructure to 1M+ active users. Currently building OPNCODEHUB, an open-source ecosystem democratizing developer tools. Architecting robust data pipelines and production ML systems.'
  }).where(eq(experiences.company, 'BoringRats'));
  console.log('Done');
  process.exit(0);
}

main();
