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

const [{ default: app }, { db }, { beats }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
]);

async function adminSessionHeaders() {
  const login = await app.request("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  expect(login.status).toBe(200);
  const setCookie = login.headers.get("set-cookie");
  expect(setCookie).toContain("HttpOnly");
  return { Cookie: setCookie!.split(";")[0] };
}

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
    const sessionHeaders = await adminSessionHeaders();
    const response = await app.request(`/api/admin/beats/${beat.id}`, {
      method: "PUT",
      headers: {
        ...sessionHeaders,
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

  test("admin beat catalog repairs inconsistent metadata and storage keys", async () => {
    const id = `beat_${randomUUID().slice(0, 8)}`;
    await db.insert(beats).values({
      id,
      title: "  Metadata Test  ",
      slug: `metadata-test-${randomUUID().slice(0, 6)}`,
      bpm: 999,
      musicalKey: " F#m ",
      genre: "  ",
      mood: " Dark ",
      tags: "trap, trap, 808 ",
      artworkUrl: "/artwork/metadata.png?stale=1",
      audioUrl: "https://cdn.example.com/preview.mp3",
      fileUrls: JSON.stringify({ MP3: "/downloads/metadata.mp3?stale=1", empty: "" }),
      priceFrom: -10,
      soldExclusive: false,
      featured: false,
      published: true,
    });

    const response = await app.request("/api/admin/beats", {
      headers: await adminSessionHeaders(),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { beats: Array<Record<string, unknown>> };
    const returned = payload.beats.find((beat) => beat.id === id);
    expect(returned).toMatchObject({
      title: "Metadata Test",
      bpm: 400,
      musicalKey: "F#m",
      genre: "Hip-Hop",
      mood: "Dark",
      tags: "trap, 808",
      artworkUrl: "artwork/metadata.png",
      audioUrl: "https://cdn.example.com/preview.mp3",
      fileUrls: JSON.stringify({ mp3: "downloads/metadata.mp3" }),
      priceFrom: 0,
    });
  });

  test("Page Builder image uploads reject unsupported formats and oversized files", async () => {
    const headers = {
      ...(await adminSessionHeaders()),
      "Content-Type": "application/json",
    };
    const unsupported = await app.request("/api/admin/upload/presign", {
      method: "POST",
      headers,
      body: JSON.stringify({
        filename: "cover.svg",
        contentType: "image/svg+xml",
        folder: "site-builder/images",
        size: 1024,
      }),
    });
    expect(unsupported.status).toBe(415);

    const oversized = await app.request("/api/admin/upload/presign", {
      method: "POST",
      headers,
      body: JSON.stringify({
        filename: "cover.png",
        contentType: "image/png",
        folder: "site-builder/images",
        size: 10 * 1024 * 1024 + 1,
      }),
    });
    expect(oversized.status).toBe(413);
  });
});
