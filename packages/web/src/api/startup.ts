import { db } from "./database";
import { beats } from "./database/schema";
import { seedDatabase } from "./seed";

/**
 * One awaited startup step, shared by the Bun server and the Vite dev plugin.
 *
 * Schema creation is NOT done here — migrations are applied by
 * `drizzle-kit migrate` before the process starts (see Dockerfile / nixpacks /
 * the `start` script). This only verifies the schema is reachable and seeds
 * demo content into an empty catalog.
 */

let readyPromise: Promise<void> | null = null;

async function run(): Promise<void> {
  try {
    // Cheap probe: if migrations never ran, fail loudly with a fixable message.
    await db.select({ id: beats.id }).from(beats).limit(1);
  } catch (e) {
    console.error(
      "[startup] Database schema is missing or unreachable. Run migrations first:\n" +
        "  cd packages/web && bun run db:migrate\n",
      e,
    );
    throw e;
  }

  await seedDatabase();
}

/** Idempotent: the work happens once per process, later callers await the same promise. */
export function ensureDatabaseReady(): Promise<void> {
  readyPromise ??= run();
  return readyPromise;
}
