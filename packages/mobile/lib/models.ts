export type LicenseTierId = "free" | "mp3" | "wav" | "unlimited" | "exclusive";

export interface Beat {
  id: string;
  title: string;
  slug: string;
  bpm: number;
  musicalKey: string;
  genre: string;
  mood: string;
  tags: string;
  artworkUrl: string;
  audioUrl: string;
  priceFrom: number;
  soldExclusive: boolean;
  featured: boolean;
  plays: number;
  createdAt: string;
}

export interface LicenseTier {
  id: LicenseTierId;
  name: string;
  priceCents: number;
  description: string;
  highlights: string[];
}

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: "free",
    name: "Free License",
    priceCents: 0,
    description: "Tagged MP3 for non-commercial release and writing sessions.",
    highlights: ["Tagged MP3", "Non-commercial use", "Producer credit required"],
  },
  {
    id: "mp3",
    name: "MP3 Lease",
    priceCents: 2400,
    description: "An untagged MP3 license for independent releases.",
    highlights: ["Untagged MP3", "Commercial release", "Producer credit required"],
  },
  {
    id: "wav",
    name: "WAV Lease",
    priceCents: 4900,
    description: "Studio-ready WAV and MP3 delivery for polished releases.",
    highlights: ["WAV + MP3", "Commercial release", "Producer credit required"],
  },
  {
    id: "unlimited",
    name: "Unlimited Lease",
    priceCents: 9900,
    description: "Unlimited distribution with WAV, MP3, and trackout stems.",
    highlights: ["WAV + MP3 + stems", "Unlimited distribution", "Producer credit required"],
  },
  {
    id: "exclusive",
    name: "Exclusive License",
    priceCents: 29900,
    description: "Full ownership transfer. This beat will no longer be leased.",
    highlights: ["WAV + MP3 + stems", "Full ownership transfer", "No further leases sold"],
  },
];

export const TIER_BY_ID = Object.fromEntries(LICENSE_TIERS.map((tier) => [tier.id, tier])) as Record<
  LicenseTierId,
  LicenseTier
>;

export const MOBILE_PRODUCT_BY_TIER: Record<Exclude<LicenseTierId, "free">, string> = {
  mp3: "com.vylanousbeats.license.mp3",
  wav: "com.vylanousbeats.license.wav",
  unlimited: "com.vylanousbeats.license.unlimited",
  exclusive: "com.vylanousbeats.license.exclusive",
};

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export interface CartItem {
  beat: Beat;
  tier: LicenseTierId;
}
