/**
 * The ONLY beat shape the public API is allowed to return.
 *
 * Deliberately does NOT include `fileUrls` (the S3 object keys of the paid
 * deliverables) or `published`. Keep this as an explicit allow-list — never
 * spread a database row into a public response.
 */
export type PublicBeat = {
  id: string;
  title: string;
  slug: string;
  bpm: number;
  musicalKey: string;
  genre: string;
  mood: string;
  tags: string;
  /** Presigned or public URL — safe to hand to the browser. */
  artworkUrl: string;
  /** Tagged preview only. */
  audioUrl: string;
  priceFrom: number;
  soldExclusive: boolean;
  featured: boolean;
  plays: number;
  createdAt: string;
};
