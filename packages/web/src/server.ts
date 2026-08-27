import app from "./api";
import { loadSettings } from "./api/lib/settings";
import { withSecurityHeaders } from "./api/lib/security-headers";
import { staticContentType } from "./static-content-type";

const port = Number(process.env.PORT ?? 3000);
const distDir = `${import.meta.dir}/../dist`;
const indexPath = `${distDir}/index.html`;

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return app.fetch(request);
    }

    if (url.pathname === "/sitemap.xml") {
      return withSecurityHeaders(
        new Response(await sitemapXml(url.origin), {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        }),
      );
    }

    const filePath = getStaticFilePath(url.pathname);
    const file = Bun.file(filePath);

    if (url.pathname !== "/" && (await file.exists())) {
      return withSecurityHeaders(
        new Response(file, {
          headers: { "Content-Type": staticContentType(url.pathname) },
        }),
      );
    }

    const index = Bun.file(indexPath);
    if (await index.exists()) {
      const html = await index.text();
      const metadata = await getPageMetadata(url);
      return withSecurityHeaders(
        new Response(injectMetadata(html, metadata), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      );
    }

    return withSecurityHeaders(
      new Response("Build output not found. Run `bun run build` first.", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }),
    );
  },
});

console.log(`Web server listening on http://localhost:${server.port}`);

function getStaticFilePath(pathname: string) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, "").replaceAll("..", "");

  return cleanPath ? `${distDir}/${cleanPath}` : indexPath;
}

async function getPageMetadata(url: URL) {
  const settings = await loadSettings();
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const page = settings.pages.find(
    (candidate) =>
      candidate.published &&
      (candidate.path || (candidate.slug === "home" ? "/" : `/${candidate.slug}`)) === path,
  );
  const title = page?.seo?.title || (page ? `${page.title} | Vylanous Beats` : "Vylanous Beats");
  const description =
    page?.seo?.description || page?.sections.find((section) => section.body)?.body || "";
  const canonicalPath = page?.seo?.canonicalPath || page?.path || path;
  const canonicalUrl = new URL(canonicalPath, url.origin).toString();
  const imageUrl = new URL(
    page?.seo?.ogImageUrl || settings.brand.fullLogoUrl,
    url.origin,
  ).toString();
  return { title, description, canonicalUrl, imageUrl, noIndex: page?.seo?.noIndex };
}

function injectMetadata(html: string, metadata: Awaited<ReturnType<typeof getPageMetadata>>) {
  const robots = metadata.noIndex ? "noindex, nofollow" : "index, follow";
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}">`,
    `<meta property="og:site_name" content="Vylanous Beats">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}">`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}">`,
    `<meta property="og:url" content="${escapeHtml(metadata.canonicalUrl)}">`,
    `<meta property="og:image" content="${escapeHtml(metadata.imageUrl)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.imageUrl)}">`,
  ].join("");
  const withoutTitle = html.replace(/<title>.*?<\/title>/i, "");
  return withoutTitle.replace("</head>", `${tags}</head>`);
}

function escapeHtml(value: string) {
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

async function sitemapXml(origin: string) {
  const settings = await loadSettings();
  const staticPaths = ["/", "/beats", "/licensing", "/about", "/privacy", "/terms"];
  const managedPaths = settings.pages
    .filter((page) => page.published)
    .map((page) => page.path || (page.slug === "home" ? "/" : `/${page.slug}`));
  const paths = [...new Set([...staticPaths, ...managedPaths])].sort();
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(new URL(path, origin).toString())}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function escapeXml(value: string) {
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
