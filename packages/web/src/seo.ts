import { type BuilderPage, type SiteSettings } from "./shared/site-settings";

export const NON_INDEXABLE_PATHS = new Set([
  "/admin",
  "/cart",
  "/dashboard",
  "/login",
  "/success",
  "/verify-email",
]);

const ROUTE_METADATA: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Vylanous Beats | Premium Hip-Hop Beats",
    description:
      "Premium hip-hop beats, flexible licensing, and instant delivery for independent artists.",
  },
  "/epk": {
    title: "Vylanous EPK | Press & Booking",
    description:
      "Official electronic press kit for Vylanous, including artist bio, press materials, and booking details.",
  },
  "/privacy": {
    title: "Privacy Policy | Vylanous Beats",
    description:
      "Learn how Vylanous Beats handles account, order, newsletter, and website information.",
  },
  "/terms": {
    title: "Terms of Service | Vylanous Beats",
    description:
      "Review the terms that apply to Vylanous Beats licenses, purchases, and website use.",
  },
};

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  noIndex: boolean;
}

export function resolvePublicOrigin(
  configuredOrigin: string | undefined,
  requestOrigin: string,
): string {
  const candidate = configuredOrigin?.trim();
  if (candidate) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      // Fall back to the request origin for an invalid local configuration.
    }
  }
  return new URL(requestOrigin).origin;
}

export function normalizePublicPath(pathname: string | undefined, fallback = "/"): string {
  const source = pathname?.trim() || fallback;
  let path: string;
  try {
    path = new URL(source, "https://local.invalid").pathname;
  } catch {
    path = fallback;
  }
  const normalized = `/${path}`.replace(/\/+/g, "/").replace(/\/+$/, "") || "/";
  return normalized === "/home" ? "/" : normalized;
}

function valueOrFallback(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function pagePath(page: Pick<BuilderPage, "path" | "slug">): string {
  return normalizePublicPath(page.path || (page.slug === "home" ? "/" : `/${page.slug}`));
}

function localPath(value: string | undefined, fallback: string, origin: string): string {
  const normalized = normalizePublicPath(value, fallback);
  const candidate = new URL(normalized, origin);
  return candidate.origin === origin ? candidate.pathname : normalizePublicPath(fallback);
}

export function metadataForPath(
  settings: SiteSettings,
  pathname: string,
  publicOrigin: string,
): PageMetadata {
  const path = normalizePublicPath(pathname);
  const page = settings.pages.find(
    (candidate) => candidate.published && pagePath(candidate) === path,
  );
  const routeFallback = ROUTE_METADATA[path];
  const titleFallback =
    routeFallback?.title || (page ? `${page.title} | Vylanous Beats` : "Vylanous Beats");
  const descriptionFallback =
    routeFallback?.description || page?.sections.find((section) => section.body)?.body || "";
  const canonicalPath = localPath(page?.seo?.canonicalPath, page?.path || path, publicOrigin);
  const imagePath = valueOrFallback(page?.seo?.ogImageUrl, settings.brand.fullLogoUrl);
  const imageUrl = new URL(imagePath, publicOrigin).toString();

  return {
    title: valueOrFallback(page?.seo?.title, titleFallback),
    description: valueOrFallback(page?.seo?.description, descriptionFallback),
    canonicalUrl: new URL(canonicalPath, publicOrigin).toString(),
    imageUrl,
    noIndex: Boolean(page?.seo?.noIndex || NON_INDEXABLE_PATHS.has(path)),
  };
}

export function sitemapPaths(settings: SiteSettings): string[] {
  const staticPaths = ["/", "/beats", "/licensing", "/about", "/privacy", "/terms"];
  const managedPaths = settings.pages
    .filter((page) => page.published && !page.seo?.noIndex)
    .map(pagePath)
    .filter((path) => !NON_INDEXABLE_PATHS.has(path));
  return [...new Set([...staticPaths, ...managedPaths])].sort();
}

export function sitemapXml(settings: SiteSettings, publicOrigin: string): string {
  const urls = sitemapPaths(settings)
    .map((path) => `  <url><loc>${escapeXml(new URL(path, publicOrigin).toString())}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function injectMetadata(html: string, metadata: PageMetadata): string {
  const robots = metadata.noIndex ? "noindex, nofollow" : "index, follow";
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}">`,
    '<meta property="og:site_name" content="Vylanous Beats">',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${escapeHtml(metadata.title)}">`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}">`,
    `<meta property="og:url" content="${escapeHtml(metadata.canonicalUrl)}">`,
    `<meta property="og:image" content="${escapeHtml(metadata.imageUrl)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.imageUrl)}">`,
  ].join("");
  return html.replace("<!--seo-->", tags);
}

export function injectCrawlerSnapshot(html: string, snapshot: string | null): string {
  if (!snapshot) return html;
  return html.replace(
    '<div id="root"></div>',
    `<div id="root" data-prerendered="true">${snapshot}</div>`,
  );
}

export function crawlerSnapshotForPath(settings: SiteSettings, pathname: string): string | null {
  const path = normalizePublicPath(pathname);
  if (NON_INDEXABLE_PATHS.has(path)) return null;

  const page = settings.pages.find(
    (candidate) => candidate.published && pagePath(candidate) === path,
  );
  const routeFallback = ROUTE_METADATA[path];
  if (!page && !routeFallback) return null;

  const title = valueOrFallback(
    page?.seo?.title,
    routeFallback?.title || page?.title || "Vylanous Beats",
  );
  const description = valueOrFallback(
    page?.seo?.description,
    routeFallback?.description || page?.sections.find((section) => section.body)?.body || "",
  );
  const excerpts = (page?.sections || [])
    .flatMap((section) => [section.title, section.body])
    .filter((value): value is string => Boolean(value?.trim()))
    .slice(0, 8)
    .map((value) => `<p>${escapeHtml(plainText(value))}</p>`)
    .join("");

  return `<main data-crawler-snapshot="true"><h1>${escapeHtml(plainText(title))}</h1><p>${escapeHtml(plainText(description))}</p>${excerpts}</main>`;
}

function plainText(value: string): string {
  return value
    .replace(/\[\/u\]|\[u\]|\*\*|__|\*|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const escaped: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return escaped[character];
  });
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    const escaped: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return escaped[character];
  });
}
