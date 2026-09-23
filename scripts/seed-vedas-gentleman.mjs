// Adds the Vedas / Upanishads (Philosophy) and the Gentleman Bastard series.
// Usage: node scripts/seed-vedas-gentleman.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const books = [
  { title: "The Rig Veda", author: "Vedic tradition", genre: "Philosophy", rating: 5,
    takeaway: "Hymns older than any scripture, asking the same questions we still ask. Best read a few at a time." },
  { title: "The Upanishads", author: "Vedic tradition", genre: "Philosophy", rating: 5,
    takeaway: "The philosophical heart of the Vedas: who is asking, and what is being asked about." },
  { title: "The Bhagavad Gita", author: "Vyasa (attributed)", genre: "Philosophy", rating: 5,
    takeaway: "Duty, doubt and action in one conversation before a battle. The clearest argument for doing your work." },
  { title: "The Lies of Locke Lamora", author: "Scott Lynch", genre: "Fantasy", rating: 5,
    takeaway: "A con inside a con inside a friendship. The most fun I have had with a fantasy heist." },
  { title: "Red Seas Under Red Skies", author: "Scott Lynch", genre: "Fantasy", rating: 4,
    takeaway: "Pirates, poison and loyalty under pressure. The sequel widens the world without losing the voice." },
  { title: "The Republic of Thieves", author: "Scott Lynch", genre: "Fantasy", rating: 4,
    takeaway: "Where the Gentleman Bastards came from, and what it costs to be one." },
];

async function resolve(title, author) {
  for (const q of [`${title} ${author}`, title]) {
    try {
      const r = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=key,title,cover_i`,
      );
      if (!r.ok) continue;
      const j = await r.json();
      const d = (j.docs || []).find((x) => x.cover_i);
      if (d) return { cover: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`, url: d.key ? `https://openlibrary.org${d.key}` : null };
    } catch {}
  }
  return { cover: null, url: null };
}

let order = 500;
for (const b of books) {
  const exists = await client.execute({ sql: "SELECT id FROM books WHERE title = ?", args: [b.title] });
  if (exists.rows.length) {
    console.log(`  skip: ${b.title}`);
    continue;
  }
  const { cover, url } = await resolve(b.title, b.author);
  await client.execute({
    sql: 'INSERT INTO books (title, author, type, category, status, rating, url, cover, takeaway, featured, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    args: [b.title, b.author, "read", b.genre, "completed", b.rating, url, cover, b.takeaway, 0, order++],
  });
  console.log(`  + ${cover ? "cover" : "no-cover"} ${b.genre.padEnd(11)} ${b.title}`);
}

// Meditations belongs with the philosophy set now
await client.execute({
  sql: "UPDATE books SET category = 'Philosophy' WHERE title = 'Meditations'",
});

const c = await client.execute("SELECT count(*) AS n FROM books");
console.log(`total ${c.rows[0].n}`);
client.close();
