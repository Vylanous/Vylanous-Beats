# Vylanous Beats — Design System

## Brand
Premium hip-hop beat store. Street/graffiti energy meets dark premium luxury.
Logo = grainy chrome skull with goat-style horns biting a dynamic mic. Stacked "VYLANOUS / BEATS" wordmark.
Architected to expand later into a full Vylanous artist landing page (merch, music videos).

## Color Palette
- `--vb-black: #0A0A0C` — base background (near-black, slight cool tint)
- `--vb-ink: #131318` — elevated surfaces / cards
- `--vb-ink-2: #1B1B22` — hover surfaces, borders
- `--vb-purple: #7C2FCB` — electric purple (primary accent, brand)
- `--vb-purple-bright: #A24DF5` — glow / highlights / hover
- `--vb-purple-deep: #4A1480` — deep purple gradients
- `--vb-silver: #C9CCD6` — metallic silver (chrome text/borders)
- `--vb-silver-bright: #EDEEF2` — near-white text
- `--vb-muted: #7A7C88` — muted/secondary text
- Gradients: purple→deep-purple meshes, chrome silver sheens on headers.

## Typography
- **HEADERS / display:** `Anton` (tall bold condensed, matches logo graffiti vibe). UPPERCASE, tight tracking. Use for hero, section titles, big price numbers.
- **SUBHEADERS:** `League Gothic` — condensed, uppercase, for eyebrows/labels/card titles.
- **BODY:** `Barlow Semi Condensed` — clean, readable, slightly condensed.
- All from Google Fonts.

## Aesthetic Rules
- Dark, moody, high-contrast. Black canvas, purple electricity, chrome accents.
- Grain/noise texture overlay on backgrounds (subtle film grain).
- Graffiti drip accents, diagonal cuts, asymmetric layouts — NOT a basic card grid.
- Purple glow on interactive elements. Chrome/silver gradient text on key headers.
- Generous negative space in hero; controlled density in catalog.
- Marquee scrolling text bands for energy ("NEW DROPS // EXCLUSIVE BEATS //").
- Custom audio player with animated waveform.

## Motion
- One orchestrated page-load with staggered reveals (Motion / framer-motion).
- Hover: purple glow lift on beat cards, play button morph.
- Waveform animates while a beat is playing.
- Marquee text bands continuously scroll.

## Layout / Pages
- **Home (/):** Hero (logo + tagline + featured beat player), marquee band, featured beats grid, license tiers preview, about strip, footer.
- **Beats (/beats):** Full catalog. Filter by genre/BPM/mood. Inline audio player + add-to-cart per license tier.
- **Beat detail (/beats/:id):** Big player, waveform, license tier selector, related beats.
- **Licensing (/licensing):** 5 tiers as pricing cards (Free / MP3 $24 / WAV $49 / Unlimited $99 / Exclusive $299), feature comparison, link to agreements.
- **Cart (/cart):** Line items, license per beat, total, checkout button.
- **Checkout success (/success):** Order confirmation + secure download links.
- **About (/about):** Vylanous Beats story, hip-hop aesthetic positioning, contact (vylanousbeats@gmail.com).

## Components
- Sticky transparent→solid nav with skull mark + cart count.
- Global persistent audio player bar (bottom) — survives navigation.
- Beat card: artwork, title, BPM/key tags, play button, price-from, quick license dropdown.
- License pricing card: tier name, price, feature list, CTA.
- Cart drawer (slide-in from right).
- Footer with logo, links, socials, newsletter.

## Anti-patterns to avoid
- No generic rounded card grids. No purple-on-white. No Inter/Roboto.
- Must look like a premium producer brand, not a SaaS template.
