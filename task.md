# Full Re-skin Customization — Build Tracker

## Scope (confirmed with user)

Full re-skin only: swap colors, fonts, logos/images across the live site via admin panel.
NOT in scope: rearranging layout/sections.

## Found on arrival

Dead/unwired scaffolding: duplicate broken settings API files, admin UI component not
imported anywhere, public settings fetch was admin-gated (401 for visitors) — nothing worked.

## Plan

- [x] Delete dead files (api/customization.ts, api/admin-customization.ts,
      database/settings.ts, database/settings-utils.ts)
- [x] shared/site-settings.ts — theme colors, 6 curated font pairs, brand asset shape, defaults
- [x] api/index.ts — GET /api/settings (public), GET/PUT /api/admin/settings, POST /api/admin/settings/reset
      Uses existing schema.ts `settings` table (id/json/createdAt/updatedAt).
- [x] lib/admin.ts — updated client helpers to new endpoints
- [x] web/lib/site-settings.tsx — SiteSettingsProvider: fetches public settings, applies
      CSS vars (--color-vb-_, --font-_) at :root so every existing Tailwind utility across
      the site (bg-vb-black, font-display, text-purple-glow, etc.) re-themes automatically.
      Injects Google Font <link> for chosen pair, sets favicon.
- [x] components/provider.tsx — wrap app in SiteSettingsProvider
- [x] nav.tsx — use brand.squareLogoUrl (in progress: img src swap)
- [ ] footer.tsx — use brand.fullLogoUrl
- [ ] rewrite web/components/admin/customization.tsx — full editor (8 color pickers,
      font pair dropdown w/ preview, 3 file uploads, save/reset, live preview strip)
- [ ] wire into admin.tsx as new tab
- [ ] bun run db:push, bun run build, start dev server, smoke test (curl /api/settings,
      load site, log into /admin, change a color, verify it applies)
- [ ] deliver

## Notes

- GitHub token was pasted in plain chat by user twice — told them to rotate it, not stored anywhere.
- index.html favicon + meta theme-color are static defaults; dynamic override happens at runtime via site-settings.tsx.
