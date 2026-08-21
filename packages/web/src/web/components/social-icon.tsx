import {
  Apple,
  AtSign,
  Cloud,
  Disc3,
  Facebook,
  Instagram,
  Linkedin,
  Link2,
  Music2,
  Send,
  Twitch,
  Video,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { SocialPlatform } from "../../shared/site-settings";

const ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  tiktok: Video,
  youtube: Youtube,
  spotify: Music2,
  soundcloud: Cloud,
  facebook: Facebook,
  x: Link2,
  threads: AtSign,
  linkedin: Linkedin,
  twitch: Twitch,
  discord: Disc3,
  telegram: Send,
  bandcamp: Music2,
  appleMusic: Apple,
  custom: Link2,
};

export function SocialIcon({
  platform,
  size = 16,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  const Icon = ICONS[platform] || Link2;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}
