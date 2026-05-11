import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { SINGLE_USER_ID, SINGLE_USER_NAME } from "../lib/user";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  const db = drizzle(sql);

  await db
    .insert(schema.users)
    .values({
      id: SINGLE_USER_ID,
      email: "local@local",
      passwordHash: "",
      name: SINGLE_USER_NAME,
    })
    .onConflictDoNothing();

  console.log(`Seeded user ${SINGLE_USER_ID}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
