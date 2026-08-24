import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Keep the selected-beat route test fully isolated from production catalog data.
const dbDir = mkdtempSync(join(tmpdir(), "vylanous-published-beats-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const [{ default: app }, { db }, { beats }, { makeAdminToken }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
  import("../lib/admin-auth"),
]);

async function seedBeat({
  title,
  published,
}: {
  title: string;
  published: boolean;
}): Promise<{ id: string; slug: string }> {
  const id = `beat_${randomUUID().slice(0, 8)}`;
  const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 6)}`;
  await db.insert(beats).values({
    id,
    title,
    slug,
    bpm: 96,
    musicalKey: "F#m",
    genre: "Hip-Hop",
    mood: "Dark",
    tags: "trap, late-night",
    artworkUrl: "artwork/selected-beat.png",
    audioUrl: "audio/selected-beat.mp3",
    fileUrls: JSON.stringify({ mp3: "downloads/selected-beat.mp3" }),
    priceFrom: 2400,
    soldExclusive: false,
    featured: false,
    published,
  });
  return { id, slug };
}

describe("Page Builder selected published beats", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("returns configured published beats in saved order, including non-featured beats", async () => {
    const firstPublished = await seedBeat({ title: "First published", published: true });
    const secondPublished = await seedBeat({ title: "Second published", published: true });
    const unconfiguredPublished = await seedBeat({ title: "Unconfigured beat", published: true });
    const unpublished = await seedBeat({ title: "Draft beat", published: false });

    const headers = { Authorization: `Bearer ${makeAdminToken()}` };
    const settingsResponse = await app.request("/api/admin/settings", { headers });
    expect(settingsResponse.status).toBe(200);
    const current = (await settingsResponse.json()) as {
      settings: { pages: Array<{ id: string; sections: Array<Record<string, unknown>> }> };
    };
    const pages = current.settings.pages.map((page) =>
      page.id === "page_home"
        ? {
            ...page,
            sections: [
              ...page.sections,
              {
                id: "selected_published_beats_test",
                type: "publishedBeats",
                title: "Test selection",
                beatIds: [secondPublished.id, firstPublished.id],
              },
            ],
          }
        : page,
    );
    const saveResponse = await app.request("/api/admin/settings", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ pages }),
    });
    expect(saveResponse.status).toBe(200);

    const event = {
      pageId: "page_home",
      blockId: "selected_published_beats_test",
      beatId: secondPublished.id,
    };
    const recordClick = () =>
      app.request("/api/beats/published-block-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...event, eventType: "card_click" }),
      });
    expect((await recordClick()).status).toBe(202);
    expect((await recordClick()).status).toBe(202);
    const playResponse = await app.request("/api/beats/published-block-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, eventType: "preview_play" }),
    });
    expect(playResponse.status).toBe(202);
    const rejectedEvent = await app.request("/api/beats/published-block-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, beatId: unconfiguredPublished.id, eventType: "card_click" }),
    });
    expect(rejectedEvent.status).toBe(404);

    const analyticsResponse = await app.request("/api/admin/published-beat-analytics?days=30", {
      headers,
    });
    expect(analyticsResponse.status).toBe(200);
    const analytics = (await analyticsResponse.json()) as {
      summary: { clicks: number; plays: number; trackedBeats: number; trackedBlocks: number };
      rows: Array<{
        beatId: string;
        clicks: number;
        plays: number;
        pageId: string;
        blockId: string;
      }>;
    };
    expect(analytics.summary).toEqual({ clicks: 2, plays: 1, trackedBeats: 1, trackedBlocks: 1 });
    expect(analytics.rows[0]).toMatchObject({
      beatId: secondPublished.id,
      pageId: event.pageId,
      blockId: event.blockId,
      clicks: 2,
      plays: 1,
    });

    const response = await app.request(
      `/api/beats/selected?id=${secondPublished.id}&id=${unpublished.id}&id=${unconfiguredPublished.id}&id=${firstPublished.id}&id=${secondPublished.id}`,
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { beats: Array<{ id: string; featured: boolean }> };
    expect(payload.beats.map((beat) => beat.id)).toEqual([secondPublished.id, firstPublished.id]);
    expect(payload.beats.every((beat) => beat.featured === false)).toBe(true);

    const selectedDetail = await app.request(`/api/beats/${secondPublished.slug}`);
    expect(selectedDetail.status).toBe(200);
    const preview = await app.request(`/api/beats/${secondPublished.id}/play`, { method: "POST" });
    expect(preview.status).toBe(200);
    const unconfiguredDetail = await app.request(`/api/beats/${unconfiguredPublished.slug}`);
    expect(unconfiguredDetail.status).toBe(401);
  });
});
