import { randomBytes } from "node:crypto";

export function appUrl(): string {
  return process.env.APP_URL || process.env.PUBLIC_URL || "";
}

/** Cryptographically-random id so tokens/ids aren't guessable. */
export function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

export function makeSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "beat"}-${id.slice(-4)}`;
}

/** Parse the JSON `fileUrls` blob defensively; never let a malformed blob crash checkout. */
export function parseFileUrls(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, string>;
  } catch {
    // fall through
  }
  return {};
}
