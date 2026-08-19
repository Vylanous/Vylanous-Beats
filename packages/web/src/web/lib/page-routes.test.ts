import { describe, expect, test } from "bun:test";
import { builderPagePath, normalizeManagedPath } from "./page-routes";

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
});
