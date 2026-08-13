/**
 * The allow-listed beat model returned by public catalog endpoints.
 *
 * Paid-delivery object keys and publication controls remain server-side so a
 * catalog response cannot be used to bypass checkout or discover private S3
 * objects.
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
  artworkUrl: string;
  audioUrl: string;
  priceFrom: number;
  soldExclusive: boolean;
  featured: boolean;
  plays: number;
  createdAt: string;
};
