import { eq, and, desc } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { beats, type Beat } from "../database/schema";
import { signIfKey } from "../lib/url-sign";
import type { PublicBeat } from "../../shared/beats";

async function serializePublicBeat(beat: Beat): Promise<PublicBeat> {
  return {
    id: beat.id,
    title: beat.title,
    slug: beat.slug,
    bpm: beat.bpm,
    musicalKey: beat.musicalKey,
    genre: beat.genre,
    mood: beat.mood,
    tags: beat.tags,
    artworkUrl: await signIfKey(beat.artworkUrl),
    audioUrl: await signIfKey(beat.audioUrl),
    priceFrom: beat.priceFrom,
    soldExclusive: beat.soldExclusive,
    featured: beat.featured,
    plays: beat.plays,
    createdAt: beat.createdAt,
  };
}

export function beatsRoutes(app: Hono) {
  app.get("/beats", async (c) => {
    const all = await db
      .select()
      .from(beats)
      .where(eq(beats.published, true))
      .orderBy(desc(beats.featured), desc(beats.createdAt));
    return c.json({ beats: await Promise.all(all.map(serializePublicBeat)) }, 200);
  });

  app.get("/beats/featured", async (c) => {
    const list = await db
      .select()
      .from(beats)
      .where(and(eq(beats.published, true), eq(beats.featured, true)))
      .orderBy(desc(beats.createdAt));
    return c.json({ beats: await Promise.all(list.map(serializePublicBeat)) }, 200);
  });

  app.get("/beats/:slug", async (c) => {
    const slug = c.req.param("slug");
    const rows = await db.select().from(beats).where(eq(beats.slug, slug)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    return c.json({ beat: await serializePublicBeat(rows[0]) }, 200);
  });

  app.post("/beats/:id/play", async (c) => {
    const id = c.req.param("id");
    const rows = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    await db
      .update(beats)
      .set({ plays: (rows[0].plays ?? 0) + 1 })
      .where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  });
}
