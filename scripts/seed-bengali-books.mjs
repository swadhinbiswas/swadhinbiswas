// Adds more Bengali greats and normalises every book to a clean genre.
// Usage: node scripts/seed-bengali-books.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ── New Bengali titles ──────────────────────────────────────────────
const newBooks = [
  { title: "Gora", author: "Rabindranath Tagore", genre: "Bengali Classics", rating: 5,
    takeaway: "Tagore's biggest question: does a country belong to you by birth or by belief? Still the sharpest thing I have read on identity." },
  { title: "Ghare Baire", author: "Rabindranath Tagore", genre: "Bengali Classics", rating: 5,
    takeaway: "Nationalism seen from inside a household, where the slogans are paid for by the people closest to you." },
  { title: "Chokher Bali", author: "Rabindranath Tagore", genre: "Bengali Classics", rating: 4,
    takeaway: "Desire, widowhood, and a woman who refuses to be a victim. Far more modern than its reputation." },
  { title: "Srikanta", author: "Sarat Chandra Chattopadhyay", genre: "Bengali Classics", rating: 5,
    takeaway: "A wanderer with no ambition to settle, and everyone he meets along the way. Bengali storytelling at its warmest." },
  { title: "Parineeta", author: "Sarat Chandra Chattopadhyay", genre: "Bengali Classics", rating: 4,
    takeaway: "Childhood love against money and social rank. Short, and it still stings." },
  { title: "Pather Dabi", author: "Sarat Chandra Chattopadhyay", genre: "Bengali Classics", rating: 4,
    takeaway: "Revolution and its cost, written before independence. The most political of Sarat Chandra." },
  { title: "Anandamath", author: "Bankim Chandra Chattopadhyay", genre: "Bengali Classics", rating: 4,
    takeaway: "The novel that gave us Vande Mataram. Religion, rebellion and sacrifice; read it for the history as much as the story." },
  { title: "Kapalkundala", author: "Bankim Chandra Chattopadhyay", genre: "Bengali Classics", rating: 4,
    takeaway: "A wild, elemental heroine and a man out of his depth. One of the earliest Bengali novels, and still strange and gripping." },
  { title: "Durgeshnandini", author: "Bankim Chandra Chattopadhyay", genre: "Bengali Classics", rating: 4,
    takeaway: "The first Bengali novel: fortresses, romance and loyalty. Worth reading for where the tradition starts." },
  { title: "Putul Nacher Itikatha", author: "Manik Bandyopadhyay", genre: "Bengali Classics", rating: 5,
    takeaway: "A doctor in a village where poverty and belief destroy people. The most unflinching Bengali novel I know." },
  { title: "Adarsha Hindu Hotel", author: "Bibhutibhushan Bandyopadhyay", genre: "Bengali Classics", rating: 4,
    takeaway: "An old cook's quiet ambition to run his own kitchen. A small story with enormous dignity." },
  { title: "Aparajito", author: "Bibhutibhushan Bandyopadhyay", genre: "Bengali Classics", rating: 5,
    takeaway: "Apu grows up and the village lets go of him. The middle book that makes Pather Panchali hurt more." },
  { title: "Hajar Churashir Maa", author: "Mahasweta Devi", genre: "Bengali Fiction", rating: 4,
    takeaway: "A mother refuses the state's version of her son's death. Political and personal at the same time." },
  { title: "Sei Samay", author: "Sunil Gangopadhyay", genre: "Bengali Fiction", rating: 5,
    takeaway: "Nineteenth-century Bengal through the people who made it. History as a novel of appetites." },
  { title: "Aranyer Din Ratri", author: "Sunil Gangopadhyay", genre: "Bengali Fiction", rating: 5,
    takeaway: "Four friends, a forest, and the shallow selves they brought with them. The best Bengali novel about pretending." },
  { title: "Chowringhee", author: "Shankar", genre: "Bengali Fiction", rating: 5,
    takeaway: "A grand hotel as the whole of a city. Funny, tender and quietly devastating." },
  { title: "Misir Ali Samagra", author: "Humayun Ahmed", genre: "Detective", rating: 5,
    takeaway: "A psychologist detective who solves people, not puzzles. The comfort read I keep coming back to." },
  { title: "Himu Samagra", author: "Humayun Ahmed", genre: "Bengali Fiction", rating: 5,
    takeaway: "A yellow-panjabi wanderer with no ambition and total freedom. Pure Bengali joy." },
  { title: "Shonkhonil Karagar", author: "Humayun Ahmed", genre: "Bengali Fiction", rating: 4,
    takeaway: "A novel about waiting, told with such warmth that the absurdity lands. The book that made him." },
  { title: "Amra Ke?", author: "Muhammed Zafar Iqbal", genre: "Science Fiction", rating: 4,
    takeaway: "Bengali science fiction from my school years, and it still holds up. Curiosity as a plot engine." },
  { title: "Agniveena", author: "Kazi Nazrul Islam", genre: "Poetry", rating: 5,
    takeaway: "Rebellion at full volume. The poems I read when I need to stop being polite." },
  { title: "Sonali Kabin", author: "Jibanananda Das", genre: "Poetry", rating: 5,
    takeaway: "Bengal as a memory that keeps dissolving. The most haunting Bengali poems I know." },
  { title: "Deshe Bideshe", author: "Syed Mujtaba Ali", genre: "Non-fiction", rating: 5,
    takeaway: "Kabul in 1927, told by the funniest Bengali prose stylist there has been. Travel writing plus a history lesson." },
  { title: "Kakababu Samagra", author: "Sunil Gangopadhyay", genre: "Adventure", rating: 5,
    takeaway: "A one-legged adventurer and his nephew, digging up forbidden history. The Bengali adventure series." },
  { title: "Professor Shonku", author: "Satyajit Ray", genre: "Science Fiction", rating: 5,
    takeaway: "A scientist's diaries: inventions, travels and quiet disasters. Ray's imagination at play." },
];

// ── Genre normalisation for everything already in the shelf ──────────
const categoryGenre = {
  "Distributed Systems": "Engineering",
  "Database Architecture": "Engineering",
  "Systems & Reliability": "Engineering",
  "Software Engineering": "Engineering",
  "Engineering Leadership": "Engineering",
  "System Design": "Engineering",
  Psychology: "Non-fiction",
  "Science & History": "Non-fiction",
  Fantasy: "Fantasy",
  Fiction: "Classics",
};
const titleGenre = {
  Aranyak: "Bengali Classics",
  "Pather Panchali": "Bengali Classics",
  "Shesher Kabita": "Bengali Classics",
  Devdas: "Bengali Classics",
  "Padma Nadir Majhi": "Bengali Classics",
  Lalsalu: "Bengali Classics",
  "Chander Pahar": "Adventure",
  Gitanjali: "Poetry",
  "Byomkesh Bakshi": "Detective",
  Feluda: "Detective",
  "Banalata Sen": "Poetry",
};

async function resolve(title, author) {
  for (const q of [`${title} ${author}`, title]) {
    try {
      const r = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=key,title,author_name,cover_i`,
      );
      if (!r.ok) continue;
      const j = await r.json();
      const doc = (j.docs || []).find((d) => d.cover_i);
      if (doc) {
        return {
          cover: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          url: doc.key ? `https://openlibrary.org${doc.key}` : null,
        };
      }
    } catch {
      /* next */
    }
  }
  return { cover: null, url: null };
}

// 1. Reassign genres
const rows = await client.execute("SELECT id, title, category FROM books");
let remapped = 0;
for (const row of rows.rows) {
  const genre = titleGenre[row.title] || categoryGenre[row.category] || row.category;
  if (genre && genre !== row.category) {
    await client.execute({
      sql: 'UPDATE books SET category = ?, "updated_at" = CURRENT_TIMESTAMP WHERE id = ?',
      args: [genre, row.id],
    });
    remapped++;
  }
}
console.log(`genres normalised: ${remapped}`);

// 2. Insert new Bengali titles
let order = 200;
for (const b of newBooks) {
  const existing = await client.execute({
    sql: "SELECT id FROM books WHERE title = ?",
    args: [b.title],
  });
  if (existing.rows.length > 0) {
    console.log(`  skip (exists): ${b.title}`);
    continue;
  }
  const { cover, url } = await resolve(b.title, b.author);
  await client.execute({
    sql: 'INSERT INTO books (title, author, type, category, status, rating, url, cover, takeaway, featured, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    args: [b.title, b.author, "read", b.genre, "completed", b.rating, url, cover, b.takeaway, 0, order++],
  });
  console.log(`  + ${cover ? "cover" : "no-cover"} ${b.genre.padEnd(16)} ${b.title}`);
}

const c = await client.execute("SELECT count(*) AS n FROM books");
console.log("books in DB:", c.rows[0].n);
client.close();
