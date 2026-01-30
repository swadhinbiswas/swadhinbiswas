// Helper functions for admin authentication
import { db, adminSessions } from '../db';
import { eq } from 'drizzle-orm';

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getSessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7); // Session valid for 7 days
  return date.toISOString();
}

export async function createSession(): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();
  
  await db.insert(adminSessions).values({
    sessionToken: token,
    expiresAt: expiresAt,
  });
  
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.sessionToken, token));
}

export async function cleanExpiredSessions(): Promise<void> {
  const now = new Date().toISOString();
  await db.delete(adminSessions).where(eq(adminSessions.expiresAt, now));
}

export function verifyCredentials(username: string, password: string): boolean {
  const adminUsername = import.meta.env.ADMIN_USERNAME || process.env.ADMIN_USERNAME;
  const adminPassword = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  
  return username === adminUsername && password === adminPassword;
}
