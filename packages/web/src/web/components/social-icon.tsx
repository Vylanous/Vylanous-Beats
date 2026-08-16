import { Facebook, Instagram, Link2, Music2, Video, Youtube, type LucideIcon } from "lucide-react";
import type { SocialPlatform } from "../../shared/site-settings";

const ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  tiktok: Video,
  youtube: Youtube,
  spotify: Music2,
  soundcloud: Music2,
  facebook: Facebook,
  x: Link2,
  custom: Link2,
};

export function SocialIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
  const Icon = ICONS[platform] || Link2;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}
