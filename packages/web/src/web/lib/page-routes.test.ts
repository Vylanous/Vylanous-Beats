import { describe, expect, test } from "bun:test";
import { MANAGED_PAGE_FALLBACK_ROUTE, builderPagePath, normalizeManagedPath } from "./page-routes";
import { matchRoute } from "wouter";

describe("managed Builder page routes", () => {
  test("normalizes home, top-level, nested, and trailing-slash paths", () => {
    expect(normalizeManagedPath("")).toBe("/");
    expect(normalizeManagedPath("artist")).toBe("/artist");
    expect(normalizeManagedPath("/artist/")).toBe("/artist");
    expect(normalizeManagedPath("//artist///blog/")).toBe("/artist/blog");
  });

  test("uses a saved path when present and falls back to the page slug", () => {
    expect(builderPagePath({ slug: "artist", path: "/artist/" })).toBe("/artist");
    expect(builderPagePath({ slug: "artist-blog", path: "/artist/blog" })).toBe("/artist/blog");
    expect(builderPagePath({ slug: "epk", path: "" })).toBe("/epk");
  });

  test("uses a true wildcard fallback for nested managed Builder pages", () => {
    expect(MANAGED_PAGE_FALLBACK_ROUTE).toBe("/*");
    expect(matchRoute(undefined, /^\/(.*)\/?$/, "/artist")[0]).toBe(true);
    expect(matchRoute(undefined, /^\/(.*)\/?$/, "/artist/blog")[0]).toBe(true);
  });
});
