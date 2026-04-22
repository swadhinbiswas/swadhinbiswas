import { db } from "./src/db";
import { projects } from "./src/db/schema";
async function run() {
  const all = await db.select().from(projects);
  console.log(all);
}
run().catch(console.error);
