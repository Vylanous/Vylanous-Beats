# Mobile Website Builder Research Notes

## Wix official mobile editor guidance

Source: https://support.wix.com/en/article/wix-editor-about-the-mobile-version-of-your-site

Wix automatically creates a mobile-friendly version and recommends keeping it enabled for mobile browsing, performance, and SEO. Its mobile editor supports adjusting desktop elements, adding and customizing mobile-only elements, and adding mobile tools. Wix also automatically resizes content for mobile screens and adjusts layout to preserve a clear, logical structure. These patterns suggest that Vylanous should provide explicit device previews, responsive overrides, optional mobile-only visibility, and a mobile-safe stacking model rather than treating mobile as an afterthought.

Key product patterns to carry forward:

- Separate desktop, tablet, and mobile preview modes.
- Responsive adaptation by default, with explicit per-device overrides where needed.
- Ability to hide or add content for a particular device.
- A visual editing surface that preserves a logical mobile reading order.
- Performance-aware mobile preview and publishing checks.

## Squarespace responsive guidance

Source: https://support.squarespace.com/hc/en-us/articles/205815398-How-will-my-site-appear-on-mobile-devices

Squarespace emphasizes responsive behavior where blocks and columns stack vertically on mobile. The builder should therefore offer automatic mobile stacking, readable breakpoint defaults, and an explicit preview mode rather than forcing users to hand-place every mobile element.

## WordPress block-editor guidance

Source: https://wordpress.org/documentation/article/wordpress-block-editor/

WordPress organizes the editor around a top toolbar, a sidebar for document and block settings, and a central content area. It supports a block inserter for blocks, patterns, and media; a document overview/list view for navigating blocks; command-palette actions; draft/save states; preview; publish; and focused/distraction-free modes. These patterns suggest the Vylanous builder should use a three-region workspace: a section/block navigator, a central device canvas, and a contextual inspector, plus a visible save/preview/publish state and reusable section patterns.
