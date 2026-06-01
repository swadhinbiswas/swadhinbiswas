import { db, skills } from "../src/db";
import { sql } from "drizzle-orm";

const newSkills: Array<{ name: string; category: string; order: number }> = [
  // Languages
  { name: "Python", category: "language", order: 10 },
  { name: "JavaScript", category: "language", order: 11 },
  { name: "TypeScript", category: "language", order: 12 },
  { name: "Rust", category: "language", order: 13 },
  { name: "Mojo", category: "language", order: 14 },

  // AI
  { name: "Machine Learning", category: "ai", order: 20 },
  { name: "Deep Learning", category: "ai", order: 21 },
  { name: "Neural Networks", category: "ai", order: 22 },
  { name: "Data Analysis", category: "ai", order: 23 },

  // Frameworks
  { name: "Django", category: "framework", order: 30 },
  { name: "FastAPI", category: "framework", order: 31 },
  { name: "React", category: "framework", order: 32 },
  { name: "Next.js", category: "framework", order: 33 },

  // Other
  { name: "Cybersecurity", category: "other", order: 40 },

  // DevOps
  { name: "Docker", category: "devops", order: 50 },
  { name: "Kubernetes", category: "devops", order: 51 },
  { name: "DevOps", category: "devops", order: 52 },

  // Database
  { name: "PostgreSQL", category: "database", order: 60 },
  { name: "Redis", category: "database", order: 61 },
  { name: "MongoDB", category: "database", order: 62 },
];

async function main() {
  console.log("Seeding skills to Turso DB...");

  // Get existing skills to avoid duplicates
  const existing = await db.select().from(skills);
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
  console.log(`Found ${existing.length} existing skills.`);

  const toInsert = newSkills.filter(
    (s) => !existingNames.has(s.name.toLowerCase())
  );

  if (toInsert.length === 0) {
    console.log("All skills already exist. Nothing to insert.");
    return;
  }

  console.log(`Inserting ${toInsert.length} new skills:`);
  toInsert.forEach((s) =>
    console.log(`  + ${s.name.padEnd(22)} [${s.category}]`)
  );

  await db.insert(skills).values(toInsert);

  const after = await db.select({ count: sql<number>`count(*)` }).from(skills);
  console.log(`Done. Skills table now has ${after[0]?.count ?? "?"} rows.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  });
