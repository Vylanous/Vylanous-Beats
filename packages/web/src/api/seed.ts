import { db } from "./database";
import { beats, settings } from "./database/schema";
import { sql } from "drizzle-orm";

interface SeedBeat {
  id: string;
  title: string;
  slug: string;
  bpm: number;
  musicalKey: string;
  genre: string;
  mood: string;
  tags: string;
  cover: number;
  audio: number;
  priceFrom: number;
  featured: boolean;
}

const SEED: SeedBeat[] = [
  {
    id: "beat_nightshift",
    title: "Night Shift",
    slug: "night-shift",
    bpm: 140,
    musicalKey: "F# Min",
    genre: "Trap",
    mood: "Dark",
    tags: "dark,hard,808,nocturnal",
    cover: 1,
    audio: 1,
    priceFrom: 2400,
    featured: true,
  },
  {
    id: "beat_chromeheart",
    title: "Chrome Heart",
    slug: "chrome-heart",
    bpm: 128,
    musicalKey: "A Min",
    genre: "Hip-Hop",
    mood: "Melodic",
    tags: "melodic,smooth,emotional",
    cover: 3,
    audio: 3,
    priceFrom: 2400,
    featured: true,
  },
  {
    id: "beat_voodoo",
    title: "Voodoo",
    slug: "voodoo",
    bpm: 150,
    musicalKey: "D Min",
    genre: "Trap",
    mood: "Aggressive",
    tags: "aggressive,hard,dark,bounce",
    cover: 2,
    audio: 2,
    priceFrom: 2400,
    featured: true,
  },
  {
    id: "beat_obsidian",
    title: "Obsidian",
    slug: "obsidian",
    bpm: 135,
    musicalKey: "C# Min",
    genre: "Drill",
    mood: "Menacing",
    tags: "drill,dark,uk,slide",
    cover: 5,
    audio: 4,
    priceFrom: 2400,
    featured: false,
  },
  {
    id: "beat_purplerain",
    title: "Purple Rain",
    slug: "purple-rain",
    bpm: 92,
    musicalKey: "G Min",
    genre: "R&B",
    mood: "Smooth",
    tags: "rnb,smooth,soulful,latenight",
    cover: 6,
    audio: 6,
    priceFrom: 2400,
    featured: true,
  },
  {
    id: "beat_static",
    title: "Static",
    slug: "static",
    bpm: 144,
    musicalKey: "E Min",
    genre: "Trap",
    mood: "Energetic",
    tags: "energetic,hype,bouncy,808",
    cover: 4,
    audio: 5,
    priceFrom: 2400,
    featured: false,
  },
];

export async function seedDatabase() {
  // Ensure settings table exists and has the default 'site' row before seeding.
  // Some runtimes / DB clients do not expose a raw `execute` on the drizzle db wrapper,
  // so avoid calling db.execute here and use high-level APIs where possible.
  try {
    try {
      const rows = await db.select().from(settings).limit(1);
      if (rows.length === 0) {
        await db.insert(settings).values({ id: "site", json: "{}" });
      }
    } catch (e) {
      // If the table doesn't exist yet, or the operation isn't supported in this runtime,
      // log and continue. Migrations should create the table in production.
      console.warn('[seed] ensure settings skipped (table missing or unsupported op)', (e as Error)?.message || e);
    }
  } catch (e) {
    console.error('[seed] unexpected error while ensuring settings', e);
  }

  const existing = await db.select({ c: sql<number>`count(*)` }).from(beats);
  if ((existing[0]?.c ?? 0) > 0) return;

  for (const b of SEED) {
    // Only the free tier maps to the tagged preview. Paid tiers are left
    // UNSET on purpose: checkout returns 409 tier_unavailable until real
    // deliverables are uploaded, so we can never sell someone a preview.
    const fileUrls = JSON.stringify({
      free: `/beats/audio/preview-${b.audio}.mp3`,
    });
    await db.insert(beats).values({
      id: b.id,
      title: b.title,
      slug: b.slug,
      bpm: b.bpm,
      musicalKey: b.musicalKey,
      genre: b.genre,
      mood: b.mood,
      tags: b.tags,
      artworkUrl: `/beats/cover-${b.cover}.png`,
      audioUrl: `/beats/audio/preview-${b.audio}.mp3`,
      fileUrls,
      priceFrom: b.priceFrom,
      featured: b.featured,
      published: true,
    });
  }
  console.log("[seed] inserted", SEED.length, "beats");
}
