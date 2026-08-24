/**
 * Admin client helpers — token auth + raw fetch wrappers.
 * The token lives in localStorage and is attached as a Bearer header.
 */

import type { SiteSettings } from "../../shared/site-settings";

const TOKEN_KEY = "vb_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function formatAdminError(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const issues = Array.isArray(record.issues)
      ? record.issues
      : Array.isArray(record.errors)
        ? record.errors
        : [];
    const details = issues
      .map((issue) => {
        if (typeof issue === "string") return issue;
        if (!issue || typeof issue !== "object") return "";
        const item = issue as Record<string, unknown>;
        const path = Array.isArray(item.path)
          ? item.path.filter((part) => part !== "").join(".")
          : "";
        const message = typeof item.message === "string" ? item.message : "Invalid value";
        return path ? `${path}: ${message}` : message;
      })
      .filter(Boolean);
    if (details.length) return details.join("; ");
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      /* noop */
    }
  }
  return fallback;
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = formatAdminError(j, msg);
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (password: string) =>
    req<{ token: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  me: () => req<{ ok: true }>("/admin/me"),
  stats: () =>
    req<{
      beats: number;
      published: number;
      orders: number;
      paidOrders: number;
      revenueCents: number;
      subscribers: number;
    }>("/admin/stats"),
  listBeats: () => req<{ beats: AdminBeat[] }>("/admin/beats"),
  getBeat: (id: string) => req<{ beat: AdminBeat }>(`/admin/beats/${id}`),
  createBeat: (data: BeatInput) =>
    req<{ id: string; slug: string }>("/admin/beats", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBeat: (id: string, data: Partial<BeatInput>) =>
    req<{ ok: true }>(`/admin/beats/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteBeat: (id: string) => req<{ ok: true }>(`/admin/beats/${id}`, { method: "DELETE" }),
  listOrders: () => req<{ orders: AdminOrder[] }>("/admin/orders"),
  listSubscribers: () =>
    req<{ subscribers: { id: string; email: string; createdAt: string }[] }>("/admin/subscribers"),
  listInbox: () => req<{ messages: InboundEmail[]; events: EmailEvent[] }>("/admin/inbox"),
  updateInboxStatus: (id: string, status: InboundEmail["status"]) =>
    req<{ ok: true }>(`/admin/inbox/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getInboxContent: (id: string) => req<{ text: string }>(`/admin/inbox/${id}/content`),
  sendEmailTest: () =>
    req<{ ok: true; providerEmailId: string | null }>("/admin/email/test", {
      method: "POST",
    }),
  presign: (filename: string, contentType: string, folder: string, size?: number) =>
    req<{ url: string; key: string }>("/admin/upload/presign", {
      method: "POST",
      body: JSON.stringify({ filename, contentType, folder, size }),
    }),
  mediaHealth: () => req<MediaHealthReport>("/admin/media-health"),
  publishedBeatAnalytics: (days: 7 | 30 | 90 = 30) =>
    req<PublishedBeatAnalyticsReport>(`/admin/published-beat-analytics?days=${days}`),
};

/** Fetch the site customization settings (admin-authenticated).
 * `settings.brand.*` are raw keys/paths (save these back as-is).
 * `preview.*` are signed/displayable urls for admin thumbnails only — never save these back. */
export async function getAdminSettings(): Promise<{
  settings: SiteSettings;
  preview: SiteSettings;
}> {
  return req<{ settings: SiteSettings; preview: SiteSettings }>("/admin/settings");
}

/** Persist a partial patch of the site customization settings (merged server-side). */
export async function saveAdminSettings(
  patch: Partial<SiteSettings>,
): Promise<{ settings: SiteSettings }> {
  return req<{ settings: SiteSettings }>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

/** Reset site customization back to brand defaults. */
export async function resetAdminSettings(): Promise<{
  settings: SiteSettings;
}> {
  return req<{ settings: SiteSettings }>("/admin/settings/reset", {
    method: "POST",
  });
}

/** Upload a file through the same-origin server endpoint and return its durable storage key. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("folder", folder);
  let response: Response;
  try {
    response = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    throw new Error(
      "The upload request could not reach the site server. Check your connection and try again.",
    );
  }
  if (response.status === 401) {
    clearToken();
    throw new Error("Your admin session expired. Sign in again before uploading.");
  }
  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message || body.error || message;
    } catch {
      /* noop */
    }
    throw new Error(message);
  }
  const result = (await response.json()) as { key?: string };
  if (!result.key) throw new Error("Upload completed without a storage key.");
  return result.key;
}

export interface AdminBeat {
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
  fileUrls: string;
  priceFrom: number;
  soldExclusive: boolean;
  featured: boolean;
  published: boolean;
  plays: number;
  createdAt: string;
  artworkSignedUrl?: string;
  audioSignedUrl?: string;
}

export interface BeatInput {
  title: string;
  bpm: number;
  musicalKey: string;
  genre: string;
  mood: string;
  tags: string;
  artworkUrl: string;
  audioUrl: string;
  fileUrls: Record<string, string>;
  priceFrom: number;
  soldExclusive: boolean;
  featured: boolean;
  published: boolean;
}

export type MediaHealthStatus =
  | "healthy"
  | "missing"
  | "broken"
  | "external"
  | "public"
  | "unavailable";
export interface MediaHealthEntry {
  id: string;
  source: string;
  kind: "image" | "video" | "audio" | "file";
  reference: string;
  normalizedKey?: string;
  status: MediaHealthStatus;
  detail: string;
}
export interface MediaHealthReport {
  checkedAt: string;
  summary: Record<MediaHealthStatus, number>;
  items: MediaHealthEntry[];
}

export interface PublishedBeatAnalyticsRow {
  pageId: string;
  pageTitle: string;
  pagePath: string;
  blockId: string;
  blockTitle: string;
  beatId: string;
  beatTitle: string;
  beatSlug: string;
  clicks: number;
  plays: number;
  total: number;
  lastDay: string;
}

export interface PublishedBeatAnalyticsReport {
  days: 7 | 30 | 90;
  sinceDay: string;
  summary: {
    clicks: number;
    plays: number;
    trackedBeats: number;
    trackedBlocks: number;
  };
  rows: PublishedBeatAnalyticsRow[];
}

export interface AdminOrder {
  id: string;
  email: string;
  name: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  items: {
    id: string;
    beatTitle: string;
    licenseName: string;
    licenseTier: string;
    priceCents: number;
  }[];
}

export interface InboundEmail {
  id: string;
  fromAddress: string;
  to: string[];
  subject: string;
  receivedAt: string;
  status: "unread" | "read" | "archived";
}

export interface EmailEvent {
  id: string;
  providerEmailId: string;
  eventType: string;
  receivedAt: string;
}
