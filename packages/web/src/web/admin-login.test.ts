import { existsSync, readFileSync, statSync } from "node:fs";

describe("Admin Studio login screen", () => {
  test("uses the tracked compact brand image instead of the corrupt legacy logo file", () => {
    const source = readFileSync(new URL("./pages/admin.tsx", import.meta.url), "utf8");

    expect(source).toContain('src="/brand/Favicon_sharp.png"');
    expect(source).not.toContain('src="/brand/skull-mark.png"');
    expect(existsSync(new URL("../../public/brand/Favicon_sharp.png", import.meta.url))).toBe(true);
    expect(
      statSync(new URL("../../public/brand/Favicon_sharp.png", import.meta.url)).size,
    ).toBeGreaterThan(0);
    expect(existsSync(new URL("../../public/brand/skull-mark.png", import.meta.url))).toBe(false);
  });
});
