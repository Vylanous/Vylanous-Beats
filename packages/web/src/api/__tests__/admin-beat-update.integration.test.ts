import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

// Set environment variables before importing the app and database so this test
// runs against an isolated local SQLite file.
const dbDir = mkdtempSync(join(tmpdir(), "vylanous-admin-update-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const [{ default: app }, { db }, { beats }, { makeAdminToken }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
  import("../lib/admin-auth"),
]);

async function seedBeat() {
  const id = `beat_${randomUUID().slice(0, 8)}`;
  const artworkUrl = "artwork/featured-preservation.png";
  const audioUrl = "audio/featured-preservation.mp3";
  const fileUrls = JSON.stringify({ mp3: "downloads/featured-preservation.mp3" });
  await db.insert(beats).values({
    id,
    title: "Featured Preservation Test",
    slug: `featured-preservation-${randomUUID().slice(0, 6)}`,
    bpm: 92,
    musicalKey: "F#m",
    genre: "Hip-Hop",
    mood: "Dark",
    tags: "",
    artworkUrl,
    audioUrl,
    fileUrls,
    priceFrom: 2400,
    soldExclusive: false,
    featured: false,
    published: true,
  });
  return { id, artworkUrl, audioUrl, fileUrls };
}

describe("admin beat updates", () => {
  beforeAll(async () => {
    // Wait for the app's idempotent seed to settle against the isolated test database.
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("a featured-only update preserves artwork, audio, and download keys", async () => {
    const beat = await seedBeat();
    const response = await app.request(`/api/admin/beats/${beat.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${makeAdminToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ featured: true }),
    });

    expect(response.status).toBe(200);
    const [saved] = await db.select().from(beats).where(eq(beats.id, beat.id));
    expect(saved.featured).toBe(true);
    expect(saved.artworkUrl).toBe(beat.artworkUrl);
    expect(saved.audioUrl).toBe(beat.audioUrl);
    expect(saved.fileUrls).toBe(beat.fileUrls);
  });
});
