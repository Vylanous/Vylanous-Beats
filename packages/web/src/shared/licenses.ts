/**
 * License tiers for Vylanous Beats. Shared between API and web frontend.
 * Prices in CAD cents. Matches the official Vylanous Beats license agreements.
 */

export type LicenseTierId = "free" | "mp3" | "wav" | "unlimited" | "exclusive";

export interface LicenseTier {
  id: LicenseTierId;
  name: string;
  priceCents: number;
  blurb: string;
  fileFormat: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: "free",
    name: "Free License",
    priceCents: 0,
    blurb: "Non-profit / demo use with credit.",
    fileFormat: "Tagged MP3",
    features: [
      "Tagged MP3 file",
      "Non-profit / demo use only",
      "Must credit \u201CProd. Vylanous Beats\u201D",
      "No monetization or distribution",
      "Producer retains all rights",
    ],
  },
  {
    id: "mp3",
    name: "MP3 Lease",
    priceCents: 2400,
    blurb: "Entry-level lease for releases.",
    fileFormat: "Untagged MP3",
    features: [
      "Untagged MP3 file",
      "Up to 10,000 streams",
      "Up to 2,000 sold copies",
      "1 music video",
      "Non-profit + for-profit use",
      "Must credit \u201CProd. Vylanous Beats\u201D",
    ],
  },
  {
    id: "wav",
    name: "WAV Lease",
    priceCents: 4900,
    blurb: "Higher quality + bigger caps.",
    fileFormat: "WAV + MP3",
    features: [
      "WAV + MP3 files",
      "Up to 50,000 streams",
      "Up to 10,000 sold copies",
      "1 music video",
      "Non-profit + for-profit use",
      "Must credit \u201CProd. Vylanous Beats\u201D",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "unlimited",
    name: "Unlimited Lease",
    priceCents: 9900,
    blurb: "No caps. Still non-exclusive.",
    fileFormat: "WAV + MP3 + Stems",
    features: [
      "WAV + MP3 + trackout stems",
      "Unlimited streams",
      "Unlimited sold copies",
      "Unlimited music videos",
      "Non-profit + for-profit use",
      "Must credit \u201CProd. Vylanous Beats\u201D",
    ],
  },
  {
    id: "exclusive",
    name: "Exclusive License",
    priceCents: 29900,
    blurb: "You own it. Beat removed from store.",
    fileFormat: "WAV + MP3 + Stems",
    features: [
      "WAV + MP3 + trackout stems",
      "Unlimited everything",
      "Beat removed from store",
      "Full ownership transfer",
      "No further leases sold",
      "Credit \u201CProd. Vylanous Beats\u201D",
    ],
    badge: "Own It",
  },
];

export const TIER_BY_ID: Record<LicenseTierId, LicenseTier> = Object.fromEntries(
  LICENSE_TIERS.map((t) => [t.id, t]),
) as Record<LicenseTierId, LicenseTier>;

export function formatCad(cents: number): string {
  if (cents === 0) return "Free";
  return "$" + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}
