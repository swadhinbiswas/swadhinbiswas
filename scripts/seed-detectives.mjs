// Adds the detective series: Sherlock Holmes, Byomkesh, Feluda.
// Usage: node scripts/seed-detectives.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const books = [
  // ── Sherlock Holmes ──────────────────────────────────────────────
  { title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", genre: "Detective", rating: 5,
    takeaway: "The blueprint for every detective who came after. Observation dressed up as magic, and the friendship underneath it." },
  { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", genre: "Detective", rating: 5,
    takeaway: "A rational mind against a legend, on a moor that wants you to believe it. Still the best Holmes novel." },
  { title: "The Memoirs of Sherlock Holmes", author: "Arthur Conan Doyle", genre: "Detective", rating: 5,
    takeaway: "Doyle tries to kill his own character and the case for deduction becomes personal." },
  { title: "A Study in Scarlet", author: "Arthur Conan Doyle", genre: "Detective", rating: 4,
    takeaway: "Where it starts: a consulting detective, a doctor back from war, and the first impossible room." },
  { title: "The Sign of the Four", author: "Arthur Conan Doyle", genre: "Detective", rating: 4,
    takeaway: "Treasure, betrayal and a chase across London. The novel that made Holmes a household name." },
  { title: "The Return of Sherlock Holmes", author: "Arthur Conan Doyle", genre: "Detective", rating: 5,
    takeaway: "The resurrection, and some of the sharpest short cases in the canon." },

  // ── Byomkesh Bakshi (Sharadindu) ─────────────────────────────────
  { title: "Byomkesh Samagra", author: "Sharadindu Bandyopadhyay", genre: "Detective", rating: 5,
    takeaway: "The complete Byomkesh in one shelf. Bengali detection built on reading people, not gadgets." },
  { title: "Chiriyakhana", author: "Sharadindu Bandyopadhyay", genre: "Detective", rating: 5,
    takeaway: "A home for the broken, a locked garden, and a killer inside. Byomkesh at his most unsettling." },
  { title: "Arthamanartham", author: "Sharadindu Bandyopadhyay", genre: "Detective", rating: 4,
    takeaway: "Money as the motive and as the mask. A tight, sour story about what people will do for it." },
  { title: "Adim Ripu", author: "Sharadindu Bandyopadhyay", genre: "Detective", rating: 4,
    takeaway: "Byomkesh among smugglers and old violence; the case that predates him and comes back for him." },
  { title: "Satyanweshi", author: "Sharadindu Bandyopadhyay", genre: "Detective", rating: 5,
    takeaway: "The first appearance of Byomkesh, and the line he is built on: truth is the only thing worth chasing." },

  // ── Feluda (Satyajit Ray) ────────────────────────────────────────
  { title: "Feluda Samagra", author: "Satyajit Ray", genre: "Detective", rating: 5,
    takeaway: "Every Feluda story in one place. Ray's warmth and travel writing wrapped around a mystery." },
  { title: "Badshahi Angti", author: "Satyajit Ray", genre: "Detective", rating: 5,
    takeaway: "Feluda's first case, in Lucknow, with a ring, a taxi and a very patient nephew. The series opens perfectly." },
  { title: "Joy Baba Felunath", author: "Satyajit Ray", genre: "Detective", rating: 5,
    takeaway: "Banaras, a stolen Ganesh, and Maganlal Meghraj. The best villain Ray ever wrote." },
  { title: "Goynar Baksho", author: "Satyajit Ray", genre: "Detective", rating: 4,
    takeaway: "Smuggling, a diamond and a chase across Bengal. Feluda at full pace." },
  { title: "Sonar Kella", author: "Satyajit Ray", genre: "Detective", rating: 5,
    takeaway: "A boy's past-life memory and a fortress in the desert. The story that made me want to travel." },
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

let order = 300;
for (const b of books) {
  const exists = await client.execute({ sql: "SELECT id FROM books WHERE title = ?", args: [b.title] });
  if (exists.rows.length) {
    console.log(`  skip (exists): ${b.title}`);
    continue;
  }
  const { cover, url } = await resolve(b.title, b.author);
  await client.execute({
    sql: 'INSERT INTO books (title, author, type, category, status, rating, url, cover, takeaway, featured, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    args: [b.title, b.author, "read", b.genre, "completed", b.rating, url, cover, b.takeaway, 0, order++],
  });
  console.log(`  + ${cover ? "cover" : "no-cover"} ${b.title}`);
}

const c = await client.execute("SELECT count(*) AS n FROM books");
const d = await client.execute("SELECT count(*) AS n FROM books WHERE category='Detective'");
console.log(`books: ${c.rows[0].n}, detective: ${d.rows[0].n}`);
client.close();
