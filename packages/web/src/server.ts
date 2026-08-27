import app from "./api";
import { loadSettings } from "./api/lib/settings";
import { withSecurityHeaders } from "./api/lib/security-headers";
import {
  crawlerSnapshotForPath,
  injectCrawlerSnapshot,
  injectMetadata,
  metadataForPath,
  resolvePublicOrigin,
  sitemapXml,
} from "./seo";
import { staticResponseHeaders } from "./static-response-headers";

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
      const settings = await loadSettings();
      return withSecurityHeaders(
        new Response(sitemapXml(settings, publicOrigin(url)), {
          headers: {
            "Cache-Control": "public, max-age=300, must-revalidate",
            "Content-Type": "application/xml; charset=utf-8",
          },
        }),
      );
    }

    const filePath = getStaticFilePath(url.pathname);
    const file = Bun.file(filePath);

    if (url.pathname !== "/" && (await file.exists())) {
      return withSecurityHeaders(
        new Response(file, {
          headers: staticResponseHeaders(url.pathname),
        }),
      );
    }

    const index = Bun.file(indexPath);
    if (await index.exists()) {
      const html = await index.text();
      const settings = await loadSettings();
      const metadata = metadataForPath(settings, url.pathname, publicOrigin(url));
      return withSecurityHeaders(
        new Response(
          injectCrawlerSnapshot(
            injectMetadata(html, metadata),
            crawlerSnapshotForPath(settings, url.pathname),
          ),
          {
            headers: {
              "Cache-Control": "no-cache",
              "Content-Type": "text/html; charset=utf-8",
            },
          },
        ),
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

function publicOrigin(url: URL): string {
  return resolvePublicOrigin(process.env.APP_URL || process.env.WEBSITE_URL, url.origin);
}

function getStaticFilePath(pathname: string) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, "").replaceAll("..", "");

  return cleanPath ? `${distDir}/${cleanPath}` : indexPath;
}
