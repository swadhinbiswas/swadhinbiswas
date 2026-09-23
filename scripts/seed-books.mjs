// Adds classic / Bengali literature to the bookshelf.
// Resolves real covers via the Open Library search API.
//   node scripts/seed-books.mjs --dry   (preview)
//   node scripts/seed-books.mjs         (insert)
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const dry = process.argv.includes("--dry");

// category groups: Psychology, Science & History, Fantasy, Fiction, Bengali Literature
const books = [
  // ── Non-fiction ──────────────────────────────────────────────────
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Psychology", rating: 5,
    takeaway: "Two systems, one mind: the fast intuitive one is confident and often wrong, the slow one is right and lazy. I now treat my first answer as a hypothesis, not a conclusion." },
  { title: "Man's Search for Meaning", author: "Viktor E. Frankl", category: "Psychology", rating: 5,
    takeaway: "Meaning is not found, it is chosen, and it holds even when everything else is taken. The most useful thing I have read about enduring hard work without losing the plot." },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", category: "Science & History", rating: 5,
    takeaway: "Large-scale human cooperation runs on shared fictions: money, nations, companies. Once you see them as fictions, you can question which ones are worth keeping." },
  { title: "Atomic Habits", author: "James Clear", category: "Psychology", rating: 4,
    takeaway: "You do not rise to your goals, you fall to your systems. Make the good behaviour obvious and the bad one hard, and consistency stops needing willpower." },
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science & History", rating: 4,
    takeaway: "Time, space and the universe have a shape, and it can be reasoned about. It taught me to hold a big question long enough to actually think about it." },
  { title: "Cosmos", author: "Carl Sagan", category: "Science & History", rating: 5,
    takeaway: "We are made of star-stuff, and science is a way of not fooling ourselves. The clearest case I have read that curiosity is a discipline, not a mood." },

  // ── World fiction ────────────────────────────────────────────────
  { title: "Harry Potter and the Philosopher's Stone", author: "J. K. Rowling", category: "Fantasy", rating: 5,
    takeaway: "The first book that made a whole world feel reachable. It is still my proof that ordinary curiosity can open a door nobody told you about." },
  { title: "Harry Potter and the Half-Blood Prince", author: "J. K. Rowling", category: "Fantasy", rating: 5,
    takeaway: "The series grows up here: memory, sacrifice and the slow cost of trusting the wrong person. The quietest book, and the one that lands hardest." },
  { title: "The Hobbit", author: "J. R. R. Tolkien", category: "Fantasy", rating: 5,
    takeaway: "A comfortable person walks out of his door and comes back changed. The adventure is small and personal, which is exactly why it works." },
  { title: "1984", author: "George Orwell", category: "Fiction", rating: 5,
    takeaway: "Language is the first casualty of control: if you cannot name a thing, you cannot argue about it. I read it once for the plot and again for the vocabulary." },
  { title: "Animal Farm", author: "George Orwell", category: "Fiction", rating: 4,
    takeaway: "Power drifts to whoever writes the rules, then rewrites them. A short book that explains a lot of organisations." },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", rating: 4,
    takeaway: "The treasure was where you started, and the journey is what made you able to see it. Simple on the surface, and it stays." },
  { title: "The Old Man and the Sea", author: "Ernest Hemingway", category: "Fiction", rating: 5,
    takeaway: "Effort and outcome are separate things, and dignity lives in the effort. The shortest great book I know about not quitting." },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", rating: 5,
    takeaway: "Real courage is doing the right thing when you know you will lose. Told so gently that the lesson lands without a speech." },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", category: "Fiction", rating: 5,
    takeaway: "The mind can justify almost anything, and the conscience keeps its own ledger anyway. The psychological weight is the point, not the crime." },
  { title: "The Kite Runner", author: "Khaled Hosseini", category: "Fiction", rating: 5,
    takeaway: "Guilt is only useful when it turns into repair. A story about cowardice that quietly becomes about redemption." },

  // ── Bengali literature ───────────────────────────────────────────
  { title: "Aranyak", author: "Bibhutibhushan Bandyopadhyay", category: "Bengali Literature", rating: 5,
    takeaway: "The forest is a character, not a setting. The clearest Bengali book I know on how a place can hold you and how clearing it costs something you cannot repay." },
  { title: "Pather Panchali", author: "Bibhutibhushan Bandyopadhyay", category: "Bengali Literature", rating: 5,
    takeaway: "Childhood told without nostalgia, poverty held with dignity. The everyday is the epic if you look closely enough." },
  { title: "Chander Pahar", author: "Bibhutibhushan Bandyopadhyay", category: "Bengali Literature", rating: 5,
    takeaway: "Bengali adventure at its best: the pull of the map, the desert, and a hunger to see what is over the next ridge." },
  { title: "Gitanjali", author: "Rabindranath Tagore", category: "Bengali Literature", rating: 5,
    takeaway: "Devotion stripped to its simplest voice. Read a page, then sit with it; it is not a book to finish quickly." },
  { title: "Shesher Kabita", author: "Rabindranath Tagore", category: "Bengali Literature", rating: 5,
    takeaway: "Love as an argument between the heart and the intellect, written with more wit than most novels dare. The last letter still stings." },
  { title: "Devdas", author: "Sarat Chandra Chattopadhyay", category: "Bengali Literature", rating: 4,
    takeaway: "Pride and self-destruction, told so plainly that you cannot look away. A warning dressed as romance." },
  { title: "Padma Nadir Majhi", author: "Manik Bandyopadhyay", category: "Bengali Literature", rating: 5,
    takeaway: "Life on the river is neither romantic nor hopeless, just relentless. The most honest Bengali novel about work and survival I have read." },
  { title: "Lalsalu", author: "Syed Waliullah", category: "Bengali Literature", rating: 4,
    takeaway: "Faith, greed and fear in one village, with no heroes at all. Sharp, unsentimental, and it refuses easy comfort." },
  { title: "Byomkesh Bakshi", author: "Sharadindu Bandyopadhyay", category: "Bengali Literature", rating: 5,
    takeaway: "Detection through reading people, not gadgets. The original Bengali rationalist, and still the best." },
  { title: "Feluda", author: "Satyajit Ray", category: "Bengali Literature", rating: 5,
    takeaway: "Observation, deduction and mischief, wrapped in travel and warmth. The stories I reread when I want to remember why I like solving things." },
  { title: "Banalata Sen", author: "Jibanananda Das", category: "Bengali Literature", rating: 5,
    takeaway: "Weariness, history and a single quiet face that makes the wandering worthwhile. Bengali poetry at its most modern." },
];

async function resolve(title, author) {
  const queries = [`${title} ${author}`, title];
  for (const q of queries) {
    try {
      const r = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=key,title,author_name,cover_i,first_publish_year`,
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
      /* try next query */
    }
  }
  return { cover: null, url: null };
}

const client = dry
  ? null
  : createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

let existingCount = 6;
let order = 100; // new titles sort after the technical shelf
for (const b of books) {
  const { cover, url } = await resolve(b.title, b.author);
  const flag = cover ? "cover ok " : "no cover ";
  console.log(`${flag} ${b.category.padEnd(20)} ${b.title} — ${b.author}`);
  if (dry || !client) continue;
  await client.execute({
    sql: 'INSERT INTO books (title, author, type, category, status, rating, url, cover, takeaway, featured, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    args: [b.title, b.author, "read", b.category, "completed", b.rating, url, cover, b.takeaway, 0, order++],
  });
  existingCount++;
}
if (client) {
  const c = await client.execute("SELECT count(*) AS n FROM books");
  console.log("books in DB:", c.rows[0].n);
  client.close();
}
console.log(`total to add: ${books.length}`);
