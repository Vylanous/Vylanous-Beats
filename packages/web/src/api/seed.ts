import { db } from "./database";
import { beats } from "./database/schema";
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
  const existing = await db.select({ c: sql<number>`count(*)` }).from(beats);
  if ((existing[0]?.c ?? 0) > 0) return;

  for (const b of SEED) {
    const fileUrls = JSON.stringify({
      free: `/beats/audio/preview-${b.audio}.mp3`,
      mp3: `/beats/audio/preview-${b.audio}.mp3`,
      wav: `/beats/audio/preview-${b.audio}.mp3`,
      unlimited: `/beats/audio/preview-${b.audio}.mp3`,
      exclusive: `/beats/audio/preview-${b.audio}.mp3`,
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
