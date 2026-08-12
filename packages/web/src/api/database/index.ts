import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { ensureSchema } from "./ensure-schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set; the API cannot start without a database.");
}

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Bootstrap tables + indexes on cold start. Awaited at module load, so every
// importer of `db` is guaranteed a ready schema. Errors are intentionally NOT
// swallowed — a broken database should fail startup, not surface as
// "no such table" on the first customer request.
await ensureSchema(client);
