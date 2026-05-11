import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const isTurso = url.startsWith("libsql://");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  ...(isTurso
    ? {
        driver: "turso" as const,
        dbCredentials: {
          url,
          authToken: process.env.DATABASE_AUTH_TOKEN,
        },
      }
    : {
        dbCredentials: { url },
      }),
} satisfies Config;
