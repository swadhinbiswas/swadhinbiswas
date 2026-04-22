import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create the Turso client
const url = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

// Support local SQLite file for development if no Turso URL is provided
const isLocal = !url || url.startsWith('file:');

const client = createClient({
  url: url || 'file:local.db',
  authToken: authToken || '',
});

// Create the Drizzle database instance
export const db = drizzle(client, { schema });

// Export the client for direct SQL queries if needed
export { client };

// Export schema for convenience
export * from './schema';
