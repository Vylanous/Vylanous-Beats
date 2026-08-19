import { describe, expect, test } from "bun:test";
import { BUILDER_FONT_OPTIONS, mergeSettings } from "./site-settings";

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

  test("preserves page-level colors and chrome linkage through settings migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_brand",
          slug: "brand",
          title: "Brand Page",
          navLabel: "Brand",
          published: true,
          showInNav: true,
          layout: {
            primaryColor: "#22D3EE",
            backgroundColor: "#111827",
            eyebrowColor: "#F59E0B",
            linkColor: "#A7F3D0",
            chrome: { header: true, navigation: true, footer: false },
          },
          sections: [],
        },
      ],
    });

    expect(settings.pages.find((page) => page.id === "page_brand")?.layout).toMatchObject({
      primaryColor: "#22D3EE",
      backgroundColor: "#111827",
      eyebrowColor: "#F59E0B",
      linkColor: "#A7F3D0",
      chrome: { header: true, navigation: true, footer: false },
    });
  });

  test("preserves page background media, treatments, and page-wide visual defaults through migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_visual",
          slug: "visual",
          title: "Visual Page",
          navLabel: "Visual",
          published: true,
          showInNav: false,
          layout: {
            backgroundColor: "#090511",
            backgroundImage: "site-builder/backgrounds/visual-page.webp",
            backgroundImageFit: "cover",
            backgroundImagePosition: "top",
            backgroundOverlay: "strong",
            pageTreatment: "grid",
            pageFont: "space-grotesk",
            contentWidth: "standard",
            sectionSpacing: "relaxed",
          },
          sections: [],
        },
      ],
    });

    expect(settings.pages.find((page) => page.id === "page_visual")?.layout).toMatchObject({
      backgroundColor: "#090511",
      backgroundImage: "site-builder/backgrounds/visual-page.webp",
      backgroundImageFit: "cover",
      backgroundImagePosition: "top",
      backgroundOverlay: "strong",
      pageTreatment: "grid",
      pageFont: "space-grotesk",
      contentWidth: "standard",
      sectionSpacing: "relaxed",
    });
  });

  test("preserves opt-in formatted text bodies through settings migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_copy",
          slug: "copy",
          title: "Copy Page",
          navLabel: "Copy",
          published: true,
          showInNav: false,
          sections: [
            {
              id: "copy_section",
              type: "text",
              body: "**Bold** _italic_ [u]underlined[/u] copy.",
              bodyFormat: "inline",
            },
          ],
        },
      ],
    });

    expect(settings.pages.find((page) => page.id === "page_copy")?.sections[0]).toMatchObject({
      body: "**Bold** _italic_ [u]underlined[/u] copy.",
      bodyFormat: "inline",
    });
  });

  test("preserves parent-child page navigation settings through migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_artist",
          slug: "artist",
          path: "/artist",
          title: "Artist",
          navLabel: "Artist",
          published: true,
          showInNav: true,
          showChildNavigation: true,
          sections: [],
        },
        {
          id: "page_artist_blog",
          slug: "blog",
          path: "/artist/blog",
          parentPageId: "page_artist",
          title: "Artist Blog",
          navLabel: "Blog",
          published: true,
          showInNav: false,
          showInFooter: false,
          sections: [],
        },
      ],
    });

    const artist = settings.pages.find((page) => page.id === "page_artist");
    const blog = settings.pages.find((page) => page.id === "page_artist_blog");
    expect(artist?.showChildNavigation).toBe(true);
    expect(blog).toMatchObject({
      parentPageId: "page_artist",
      path: "/artist/blog",
      showInNav: false,
      showInFooter: false,
    });
  });

  test("provides fifty concrete Builder fonts and migrates legacy font selections", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_font_test",
          slug: "font-test",
          title: "Font Test",
          navLabel: "Font Test",
          published: true,
          showInNav: false,
          sections: [{ id: "font_section", type: "text", layout: { fontFamily: "mono" as never } }],
        },
      ],
    });

    expect(BUILDER_FONT_OPTIONS).toHaveLength(50);
    expect(BUILDER_FONT_OPTIONS.map((font) => font.label)).toEqual(
      expect.arrayContaining(["Anton", "Barlow Condensed", "Arial Narrow"]),
    );
    expect(settings.pages.find((page) => page.id === "page_font_test")?.sections[0].layout?.fontFamily).toBe(
      "space-mono",
    );
  });

  test("preserves independent heading and body fonts with direct text sizes", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_typography",
          slug: "typography",
          title: "Typography",
          navLabel: "Typography",
          published: true,
          showInNav: false,
          sections: [
            {
              id: "typography_copy",
              type: "text",
              layout: {
                fontFamily: "anton",
                bodyFontFamily: "inter",
                eyebrowSize: "14px",
                headingSize: "72px",
                bodySize: "20px",
              },
            },
          ],
        },
      ],
    });

    expect(settings.pages.find((page) => page.id === "page_typography")?.sections[0].layout).toMatchObject({
      fontFamily: "anton",
      bodyFontFamily: "inter",
      eyebrowSize: "14px",
      headingSize: "72px",
      bodySize: "20px",
    });
  });

  test("preserves Press Kit platform and audience analytics through settings migration", () => {
    const settings = mergeSettings({
      pages: [
        {
          id: "page_epk",
          slug: "epk",
          title: "Electronic Press Kit",
          navLabel: "EPK",
          published: true,
          showInNav: true,
          sections: [
            {
              id: "epk_press",
              type: "pressKit",
              title: "Press Kit",
              pressKit: {
                updatedAt: "August 2026",
                sourceNote: "Platform analytics",
                metrics: [
                  {
                    id: "youtube",
                    platform: "youtube",
                    label: "YouTube",
                    subscribers: 12500,
                    videos: 42,
                    views: 240000,
                  },
                ],
                audience: {
                  gender: [{ label: "Women", value: 42 }],
                  age: [{ label: "18–24", value: 38 }],
                  locations: [{ label: "United States", value: 61 }],
                },
              },
            },
          ],
        },
      ],
    });

    const pressKit = settings.pages
      .find((page) => page.id === "page_epk")
      ?.sections.find((section) => section.id === "epk_press")?.pressKit;
    expect(pressKit).toMatchObject({
      updatedAt: "August 2026",
      metrics: [{ platform: "youtube", subscribers: 12500, videos: 42, views: 240000 }],
      audience: {
        gender: [{ label: "Women", value: 42 }],
        locations: [{ label: "United States", value: 61 }],
      },
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
