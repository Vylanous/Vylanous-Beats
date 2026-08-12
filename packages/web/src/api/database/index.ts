import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// NOTE: schema is created by real drizzle-kit migrations (`bunx drizzle-kit migrate`),
// which run as an explicit deploy/start step. There is deliberately no
// "auto-create tables" shim here — the old one silently created nothing and
// hid a broken deploy behind 500s.
export { client };
