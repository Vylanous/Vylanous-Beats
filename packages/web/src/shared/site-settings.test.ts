import { describe, expect, test } from "bun:test";
import { mergeSettings } from "./site-settings";

describe("Site Builder settings migration", () => {
  test("adds all core public pages and global chrome to legacy page-builder settings", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_artist",
          slug: "artist",
          title: "Saved Artist Page",
          navLabel: "Artist",
          published: true,
          showInNav: true,
          sections: [
            { id: "artist_story", type: "text", title: "Saved story", body: "Existing copy" },
          ],
        },
      ],
    });

    expect(settings.pages.map((page) => page.path)).toEqual(
      expect.arrayContaining(["/", "/beats", "/licensing", "/about", "/artist", "/epk", "/merch"]),
    );
    expect(settings.pages.find((page) => page.path === "/artist")?.title).toBe("Saved Artist Page");
    expect(
      settings.pages.find((page) => page.path === "/artist")?.sections[0]?.layout?.surface,
    ).toBe("transparent");
    expect(settings.header.showCart).toBe(true);
    expect(settings.footer.contactEmail).toBe("support@vylanous.com");
  });
});
