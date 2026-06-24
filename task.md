# Vylanous Beats Store — Build Tracker

## Goal
Premium hip-hop beat store. Custom cart + Stripe one-time checkout + secure download + email delivery.
Dark purple/silver/black street aesthetic. Architected to expand into full artist landing page later.

## Hosting plan (deliver to user)
- Build on Runable managed stack -> Publish via platform -> add custom domain www.vylanous.com
- Buy domain at Cloudflare Registrar (~$10/yr) or Porkbun. Hosting+SSL via platform = free.

## Stack decisions
- Stripe Checkout one-time payments (user adds STRIPE_SECRET_KEY)
- Free license = instant order, no stripe
- Delivery: token-gated download page + send-email CLI
- Fonts: Anton (display), League Gothic (sub), Barlow Semi Condensed (body)
- Colors: black #0A0A0C, purple #7C2FCB/#A24DF5, silver chrome

## Progress
- [x] app_init scaffold
- [x] brand logos copied to public/brand
- [x] design.md
- [x] styles.css (fonts, palette, grain, marquee, waveform, chrome text)
- [x] db schema (beats, orders, orderItems, subscribers)
- [x] shared/licenses.ts (5 tiers)
- [x] seed.ts (6 beats) + cover art + preview audio
- [x] api/index.ts (beats, checkout, confirm, orders, subscribe)  <- FIX zValidator -> use @hono/zod-validator
- [ ] cart store (zustand or context + localStorage)
- [ ] Layout: nav + global audio player + footer
- [ ] Pages: home, beats, beat detail, licensing, cart, success, about
- [ ] components: beat card, license card, waveform player, cart drawer
- [ ] favicon + index.html meta/SEO
- [ ] db:push, build, run dev, screenshot test
- [ ] deliver + hosting instructions

## Notes
- exclusive purchase -> mark beat soldExclusive + unpublish
- never trust client prices; resolve tier price server-side
