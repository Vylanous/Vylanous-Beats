/** Normalizes Builder-owned routes for client matching and navigation. */
export function normalizeManagedPath(value: string | null | undefined): string {
  const raw = (value || "/").trim();
  const pathname = raw.startsWith("/") ? raw : `/${raw}`;
  const normalized = pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return normalized || "/";
}

export function builderPagePath(page: { path?: string | null; slug: string }): string {
  return normalizeManagedPath(page.path || `/${page.slug}`);
}
