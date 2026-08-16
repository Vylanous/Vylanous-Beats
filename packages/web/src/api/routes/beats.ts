import { eq, and, desc } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { beats, type Beat } from "../database/schema";
import { signIfKey } from "../lib/url-sign";
import type { PublicBeat } from "../../shared/beats";
import { customerFromRequest, requireVerifiedCustomer } from "../lib/customer-auth";

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
  app.get("/beats", requireVerifiedCustomer, async (c) => {
    const all = await db
      .select()
      .from(beats)
      .where(eq(beats.published, true))
      .orderBy(desc(beats.featured), desc(beats.createdAt));
    c.header("Cache-Control", "private, no-store");
    return c.json({ beats: await Promise.all(all.map(serializePublicBeat)) }, 200);
  });

  // Featured tracks remain public so visitors can discover the catalog before registering.
  app.get("/beats/featured", async (c) => {
    const list = await db
      .select()
      .from(beats)
      .where(and(eq(beats.published, true), eq(beats.featured, true)))
      .orderBy(desc(beats.createdAt));
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
      if (!customer.emailVerified) {
        return c.json({ error: "email_verification_required", email: customer.email }, 403);
      }
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
      if (!customer.emailVerified) {
        return c.json({ error: "email_verification_required", email: customer.email }, 403);
      }
    }
    await db
      .update(beats)
      .set({ plays: (beat.plays ?? 0) + 1 })
      .where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  });
}
