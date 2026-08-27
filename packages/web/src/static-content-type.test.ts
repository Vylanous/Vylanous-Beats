import { staticContentType } from "./static-content-type";
import { staticResponseHeaders } from "./static-response-headers";

describe("static asset content types", () => {
  test("serves Vite module bundles as JavaScript instead of plain text", () => {
    expect(staticContentType("/assets/index-abc123.js")).toBe(
      "application/javascript; charset=utf-8",
    );
    expect(staticContentType("/assets/vendor.mjs")).toBe("application/javascript; charset=utf-8");
  });

  test("assigns explicit types for browser-loaded style, image, font, and media assets", () => {
    expect(staticContentType("/assets/site.css")).toBe("text/css; charset=utf-8");
    expect(staticContentType("/brand/logo.webp")).toBe("image/webp");
    expect(staticContentType("/fonts/heading.woff2")).toBe("font/woff2");
    expect(staticContentType("/audio/preview.mp3")).toBe("audio/mpeg");
  });

  test("allows long-lived caching only for versioned Vite assets", () => {
    expect(staticResponseHeaders("/assets/index-abc123.js")).toMatchObject({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "application/javascript; charset=utf-8",
    });
    expect(staticResponseHeaders("/brand/Logo_full_transparent.png")).not.toHaveProperty(
      "Cache-Control",
    );
  });
});
