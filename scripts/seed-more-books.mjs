// Takes the shelf to ~100: requested series + more Bengali/world detective,
// gothic horror (Dracula), and best-of classics.
// Usage: node scripts/seed-more-books.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const books = [
  // ── Bengali detective & adventure series ─────────────────────────
  { title: "Arjun Samagra", author: "Samaresh Majumdar", genre: "Detective", rating: 5,
    takeaway: "Arjun runs on memory and old crimes, not clever tricks. The Bengali detective who feels like a person." },
  { title: "Kiriti Roy Samagra", author: "Nihar Ranjan Gupta", genre: "Detective", rating: 5,
    takeaway: "A doctor-detective who works by reasoning and nerve. The other great Bengali series." },
  { title: "Jayanta Samagra", author: "Hemendra Kumar Roy", genre: "Detective", rating: 4,
    takeaway: "The earliest Bengali detective: disguises, secret societies and old Calcutta. Still fun." },
  { title: "Gogol Samagra", author: "Samaresh Majumdar", genre: "Detective", rating: 5,
    takeaway: "A boy detective with a bicycle and no fear. The series that made me want to notice things." },
  { title: "Pandab Goyenda", author: "Samaresh Majumdar", genre: "Detective", rating: 4,
    takeaway: "Pandab and his friends solving what the adults miss. Bengali detection for the young and the nostalgic." },
  { title: "Mitin Mashi Samagra", author: "Suchitra Bhattacharya", genre: "Detective", rating: 5,
    takeaway: "A housewife who out-thinks the police. Bengal's best-known woman detective." },
  { title: "Tarini Khuro", author: "Rabindranath Tagore", genre: "Detective", rating: 5,
    takeaway: "An old storyteller whose tall tales always turn out to be true. Tagore doing suspense, and doing it well." },
  { title: "Tenida Samagra", author: "Narayan Gangopadhyay", genre: "Adventure", rating: 5,
    takeaway: "Tenida and his four friends, blundering into adventure. The funniest Bengali series there is." },
  { title: "Professor Shonku Samagra", author: "Satyajit Ray", genre: "Science Fiction", rating: 5,
    takeaway: "Every Shonku diary in one place: inventions, expeditions and quiet catastrophe. Ray's imagination unbound." },

  // ── World detective classics ─────────────────────────────────────
  { title: "The Murder of Roger Ackroyd", author: "Agatha Christie", genre: "Detective", rating: 5,
    takeaway: "The trick that changed the genre. Christie plays fair and still gets you." },
  { title: "Murder on the Orient Express", author: "Agatha Christie", genre: "Detective", rating: 5,
    takeaway: "A closed carriage, twelve suspects, and a moral question instead of a simple answer." },
  { title: "And Then There Were None", author: "Agatha Christie", genre: "Detective", rating: 5,
    takeaway: "Ten strangers, a nursery rhyme, and no detective at all. The best-selling crime novel for a reason." },
  { title: "The Moonstone", author: "Wilkie Collins", genre: "Detective", rating: 4,
    takeaway: "The first detective novel, and it still reads like one written last year." },
  { title: "The Maltese Falcon", author: "Dashiell Hammett", genre: "Detective", rating: 5,
    takeaway: "A detective who wants nothing and trusts no one. The book that made crime fiction hard-boiled." },
  { title: "The Big Sleep", author: "Raymond Chandler", genre: "Detective", rating: 4,
    takeaway: "Plot is not the point; the voice is. Chandler's prose is the reason to read crime." },
  { title: "The Innocence of Father Brown", author: "G. K. Chesterton", genre: "Detective", rating: 4,
    takeaway: "A priest solving crimes by understanding people rather than clues." },

  // ── Gothic horror (the Dracula shelf) ────────────────────────────
  { title: "Dracula", author: "Bram Stoker", genre: "Horror", rating: 5,
    takeaway: "Fear built from diaries, telegrams and letters, so you end up believing all of it." },
  { title: "Dracula's Guest and Other Weird Stories", author: "Bram Stoker", genre: "Horror", rating: 4,
    takeaway: "The stories around the novel, including the cut first chapter. Stoker is best when he is atmospheric." },
  { title: "Frankenstein", author: "Mary Shelley", genre: "Horror", rating: 5,
    takeaway: "The question is not whether you can create life but whether you will care for it." },
  { title: "Carmilla", author: "Sheridan Le Fanu", genre: "Horror", rating: 4,
    takeaway: "A vampire novella that predates Dracula, with desire as the horror. Short and unnerving." },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", genre: "Horror", rating: 4,
    takeaway: "A portrait ages so its subject does not. Wilde's wit and his warning in one book." },

  // ── Classics & non-fiction (best-of) ─────────────────────────────
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Classics", rating: 5,
    takeaway: "Society as a puzzle of money, manners and pride, solved by paying attention." },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classics", rating: 4,
    takeaway: "The parties are the noise; the point is the man who invented himself and lost the plot." },
  { title: "One Hundred Years of Solitude", author: "Gabriel Garcia Marquez", genre: "Classics", rating: 5,
    takeaway: "A family, a town, and a hundred years of the same mistakes in glorious repetition." },
  { title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Non-fiction", rating: 5,
    takeaway: "A teenager writing while in hiding, and somehow still full of curiosity and hope." },
  { title: "Meditations", author: "Marcus Aurelius", genre: "Non-fiction", rating: 5,
    takeaway: "A Roman emperor arguing himself into calm. The oldest self-help that still works." },
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

let order = 400;
let added = 0;
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
  console.log(`  + ${cover ? "cover" : "no-cover"} ${b.genre.padEnd(14)} ${b.title}`);
  added++;
}

const c = await client.execute("SELECT count(*) AS n FROM books");
console.log(`added ${added}; total ${c.rows[0].n}`);
client.close();
