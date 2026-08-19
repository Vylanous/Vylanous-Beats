import { and, desc, eq, ne, or } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { beats, type Beat } from "../database/schema";
import { signIfKey } from "../lib/url-sign";
import type { PublicBeat } from "../../shared/beats";
import { customerFromRequest, requireCustomer } from "../lib/customer-auth";

async function publishUploadedDrafts() {
  await db
    .update(beats)
    .set({ published: true })
    .where(
      and(
        eq(beats.published, false),
        or(ne(beats.audioUrl, ""), ne(beats.artworkUrl, "")),
      ),
    );
}

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
  // The complete catalog is a customer-account benefit across the web and native app.
  app.get("/beats", requireCustomer, async (c) => {
    await publishUploadedDrafts();
    const all = await db
      .select()
      .from(beats)
      .where(eq(beats.published, true))
      .orderBy(desc(beats.featured), desc(beats.createdAt));
    c.header("Cache-Control", "private, no-store");
    return c.json({ beats: await Promise.all(all.map(serializePublicBeat)) }, 200);
  });

  // Featured tracks remain public so visitors can discover the catalog before registering.
  // Uploaded beats created by the bulk uploader are legitimate catalog records, not empty
  // drafts; reconcile those records so a completed upload cannot silently disappear.
  app.get("/beats/featured", async (c) => {
    await publishUploadedDrafts();
    const list = await db
      .select()
      .from(beats)
      .where(eq(beats.published, true))
      .orderBy(desc(beats.featured), desc(beats.createdAt));
    c.header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return c.json({ beats: await Promise.all(list.map(serializePublicBeat)) }, 200);
  });

  app.get("/beats/:slug", async (c) => {
    const slug = c.req.param("slug");
    const rows = await db.select().from(beats).where(eq(beats.slug, slug)).limit(1);
    const beat = rows[0];
    if (!beat || !beat.published) return c.json({ error: "Not found" }, 404);
    if (!beat.featured) {
      const customer = await customerFromRequest(c);
      if (!customer) return c.json({ error: "customer_auth_required" }, 401);
    }
    c.header(
      "Cache-Control",
      beat.featured
        ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
        : "private, no-store",
    );
    return c.json({ beat: await serializePublicBeat(beat) }, 200);
  });

  app.post("/beats/:id/play", async (c) => {
    const id = c.req.param("id");
    const rows = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    const beat = rows[0];
    if (!beat) return c.json({ error: "Not found" }, 404);
    if (!beat.featured) {
      const customer = await customerFromRequest(c);
      if (!customer) return c.json({ error: "customer_auth_required" }, 401);
    }
    await db
      .update(beats)
      .set({ plays: (beat.plays ?? 0) + 1 })
      .where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  });
}
