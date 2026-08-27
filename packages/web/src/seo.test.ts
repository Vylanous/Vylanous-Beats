import { readFileSync } from "node:fs";
import { DEFAULT_SETTINGS, mergeSettings } from "./shared/site-settings";
import {
  crawlerSnapshotForPath,
  injectCrawlerSnapshot,
  injectMetadata,
  metadataForPath,
  resolvePublicOrigin,
  sitemapXml,
} from "./seo";

describe("production SEO metadata", () => {
  const origin = "https://www.vylanous.com";

  test("uses the configured public HTTPS origin and normalizes home canonicals", () => {
    expect(resolvePublicOrigin(origin, "http://internal:3000")).toBe(origin);
    expect(metadataForPath(DEFAULT_SETTINGS, "/", origin).canonicalUrl).toBe(`${origin}/`);
    expect(metadataForPath(DEFAULT_SETTINGS, "/home", origin).canonicalUrl).toBe(`${origin}/`);
  });

  test("restores default seeded SEO copy when a legacy saved page has blank fields", () => {
    const settings = mergeSettings({
      pages: [{ id: "page_epk", slug: "epk", path: "/epk", seo: { title: "", description: "" } }],
    });
    const metadata = metadataForPath(settings, "/epk", origin);
    expect(metadata.title).toBe("Vylanous EPK | Press & Booking");
    expect(metadata.description).toContain("Official electronic press kit");
  });

  test("provides route-specific EPK and legal metadata and marks utility routes noindex", () => {
    expect(metadataForPath(DEFAULT_SETTINGS, "/epk", origin)).toMatchObject({
      title: "Vylanous EPK | Press & Booking",
      description: expect.stringContaining("Official electronic press kit"),
      noIndex: false,
    });
    expect(metadataForPath(DEFAULT_SETTINGS, "/privacy", origin)).toMatchObject({
      title: "Privacy Policy | Vylanous Beats",
      description: expect.stringContaining("account, order, newsletter"),
      noIndex: false,
    });
    expect(metadataForPath(DEFAULT_SETTINGS, "/terms", origin)).toMatchObject({
      title: "Terms of Service | Vylanous Beats",
      description: expect.stringContaining("licenses, purchases"),
      noIndex: false,
    });
    expect(metadataForPath(DEFAULT_SETTINGS, "/login", origin).noIndex).toBe(true);
  });

  test("emits one metadata set and an HTTPS sitemap without the login route", () => {
    const template = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const metadata = metadataForPath(DEFAULT_SETTINGS, "/beats", origin);
    const html = injectMetadata(template, metadata);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);
    expect(html.match(/<meta property="og:title"/g)).toHaveLength(1);
    expect(html.match(/<meta name="twitter:title"/g)).toHaveLength(1);
    expect(html).toContain(`href="${origin}/beats"`);

    const sitemap = sitemapXml(DEFAULT_SETTINGS, origin);
    expect(sitemap).toContain(`<loc>${origin}/beats</loc>`);
    const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);
    expect(locations.every((location) => location.startsWith(origin))).toBe(true);
    expect(sitemap).not.toContain("/login</loc>");
  });

  test("provides an escaped public crawler snapshot but never private-route content", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_artist",
          slug: "artist",
          path: "/artist",
          seo: { title: "Artist <script>unsafe</script>" },
        },
      ],
    });
    const snapshot = crawlerSnapshotForPath(settings, "/artist");
    expect(snapshot).toContain("Artist &lt;script&gt;unsafe&lt;/script&gt;");
    expect(snapshot).not.toContain("<script>unsafe</script>");
    expect(crawlerSnapshotForPath(settings, "/dashboard")).toBeNull();
    expect(injectCrawlerSnapshot('<div id="root"></div>', snapshot)).toContain(
      'data-prerendered="true"',
    );
  });
});
