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
      msg = j.message || j.error || msg;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (password: string) =>
    req<{ token: string }>("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
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
    req<{ ok: true }>(`/admin/beats/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBeat: (id: string) => req<{ ok: true }>(`/admin/beats/${id}`, { method: "DELETE" }),
  listOrders: () => req<{ orders: AdminOrder[] }>("/admin/orders"),
  listSubscribers: () =>
    req<{ subscribers: { id: string; email: string; createdAt: string }[] }>("/admin/subscribers"),
  presign: (filename: string, contentType: string, folder: string) =>
    req<{ url: string; key: string }>("/admin/upload/presign", {
      method: "POST",
      body: JSON.stringify({ filename, contentType, folder }),
    }),
};

/** Fetch the site customization settings (admin-authenticated).
 * `settings.brand.*` are raw keys/paths (save these back as-is).
 * `preview.*` are signed/displayable urls for admin thumbnails only — never save these back. */
export async function getAdminSettings(): Promise<{
  settings: SiteSettings;
  preview: SiteSettings["brand"];
}> {
  return req<{ settings: SiteSettings; preview: SiteSettings["brand"] }>("/admin/settings");
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
export async function resetAdminSettings(): Promise<{ settings: SiteSettings }> {
  return req<{ settings: SiteSettings }>("/admin/settings/reset", { method: "POST" });
}

/** Upload a file to Tigris via presigned PUT. Returns the stored object key. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const { url, key } = await adminApi.presign(
    file.name,
    file.type || "application/octet-stream",
    folder,
  );
  const put = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!put.ok) {
    let detail = "";
    try {
      detail = (await put.text()).slice(0, 200);
    } catch {
      /* noop */
    }
    throw new Error(`Upload failed (${put.status})${detail ? `: ${detail}` : ""}`);
  }
  return key;
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
