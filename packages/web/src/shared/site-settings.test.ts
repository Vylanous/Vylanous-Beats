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
    expect(settings.builder).toEqual({ drafts: [], templates: [], versions: [] });
  });

  test("adds newsletter popup defaults to legacy settings", () => {
    const settings = mergeSettings({});

    expect(settings.newsletterPopup.enabled).toBe(true);
    expect(settings.newsletterPopup.delayMs).toBe(4500);
    expect(settings.newsletterPopup.consentText).toContain("email");
  });

  test("preserves customized newsletter popup settings", () => {
    const settings = mergeSettings({
      newsletterPopup: {
        enabled: false,
        delayMs: 1200,
        title: "Private drops",
        consentText: "Keep me posted.",
      },
    });

    expect(settings.newsletterPopup.enabled).toBe(false);
    expect(settings.newsletterPopup.delayMs).toBe(1200);
    expect(settings.newsletterPopup.title).toBe("Private drops");
    expect(settings.newsletterPopup.consentText).toBe("Keep me posted.");
    expect(settings.newsletterPopup.buttonLabel).toBe("Join the list");
  });

  test("preserves uploaded feature-card artwork through settings migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "home",
          slug: "home",
          title: "Home",
          navLabel: "Home",
          published: true,
          showInNav: true,
          sections: [
            {
              id: "home_values",
              type: "featureCards",
              items: [
                {
                  id: "delivery",
                  title: "Instant Delivery",
                },
                {
                  id: "licensing",
                  title: "Clear Licensing",
                  body: "Five tiers from free to full exclusive ownership.",
                  imageUrl: "site-builder/images/clear-licensing-artwork.png",
                },
                {
                  id: "quality",
                  title: "Studio Quality",
                },
              ],
            },
          ],
        },
      ],
    });

    const section = settings.pages.find((page) => page.id === "home")?.sections[0];
    expect(section?.items?.find((item) => item.id === "licensing")).toMatchObject({
      id: "licensing",
      title: "Clear Licensing",
      imageUrl: "site-builder/images/clear-licensing-artwork.png",
    });
  });

  test("preserves advanced section metadata through settings migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_custom",
          slug: "custom",
          title: "Custom",
          navLabel: "Custom",
          published: true,
          showInNav: false,
          sections: [
            {
              id: "section_custom",
              type: "text",
              title: "Custom section",
              anchorId: "custom-copy",
              customClass: "artist-intro",
              ariaLabel: "Artist introduction",
            },
          ],
        },
      ],
    });

    expect(settings.pages.find((page) => page.id === "page_custom")?.sections[0]).toMatchObject({
      anchorId: "custom-copy",
      customClass: "artist-intro",
      ariaLabel: "Artist introduction",
    });
  });

  test("preserves private builder metadata when it is present", () => {
    const settings = mergeSettings({
      builder: {
        drafts: [],
        templates: [
          {
            id: "template_1",
            name: "Artist launch",
            createdAt: "2026-08-14T00:00:00.000Z",
            updatedAt: "2026-08-14T00:00:00.000Z",
            sections: [{ id: "hero_1", type: "hero", title: "Launch" }],
          },
        ],
        versions: [],
      },
    });

    expect(settings.builder.templates[0]?.name).toBe("Artist launch");
    expect(settings.builder.templates[0]?.sections[0]?.type).toBe("hero");
  });
});
