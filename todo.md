# Vylanous Beats Code Cleanup

- [x] Sync the local repository with merged `main` and verify the starting state.
- [x] Identify dead code, duplicated helpers, unsafe casts, and inconsistent patterns in the web package.
- [x] Apply behavior-preserving cleanup with focused refactors and clearer types.
- [x] Run repository linting, web type-checking, production build, and isolated tests.
- [x] Commit and publish the validated cleanup branch for review.

## Bundle Optimization

- [x] Sync the merged main branch and measure the current production bundle.
- [x] Lazy-load admin and secondary routes while preserving application routing behavior.
- [x] Rebuild and add vendor chunking only when bundle measurement supports it.
- [x] Validate, commit, and publish the optimized production build.

## Merge and Deployment Verification

- [x] Confirm PR #15 is mergeable and merge it into main.
- [x] Inspect the deployment workflow and verify the triggered GitHub Actions run succeeds.
- [x] Report the merged revision and deployment status.

## Runtime Performance Pass

- [x] Sync the current main branch and inspect image, animation, audio, and catalog loading paths.
- [x] Apply safe image-loading priorities and reduce avoidable animation work.
- [x] Improve audio initialization and catalog request behavior where supported by the API.
- [x] Measure, validate, commit, and publish the performance improvements.

## Website Builder and Fourthwall Merchandise Expansion

- [x] Verify Fourthwall integration options and select the storefront approach: custom storefront with vylanous-shop.fourthwall.com checkout.
- [x] Define editable page sections, dynamic-page data, and merch product structures.
- [x] Build the admin builder experience and public page renderer.
- [x] Connect Fourthwall merchandise browsing and checkout to the selected page layout.
- [x] Validate and publish the expanded platform.
- [ ] Add `FOURTHWALL_STOREFRONT_TOKEN` as a Vercel production secret to activate live catalog data.

## Page Builder SEO

- [x] Add editable title, description, canonical path, and Open Graph image metadata to builder pages.
- [x] Apply saved metadata to public dynamic-page document tags.
- [x] Validate, commit, and publish the SEO controls.

## Email Service Audit

- [x] Inspect outbound email configuration, templates, and runtime error handling.
- [x] Verify inbound email or contact-form receiving capability and routing.
- [ ] Report readiness findings and any safe remediation steps.

## Secure Email Inbox

- [x] Add database records for inbound email events and delivery-status events.
- [x] Add a verified Resend webhook endpoint with idempotent event handling.
- [x] Add admin inbox and email-status views.
- [x] Validate the workflow and prepare a safe Resend test-email verification.
- [ ] Configure production Resend secrets and register the live inbound-email webhook.

## Support Email Correction

- [x] Locate and replace all customer-facing contact-email references with support@vylanous.com.
- [x] Validate the updated website references and publish the correction for review.

## Contextual Page Builder Controls

- [x] Map field visibility and labels to each page-section type.
- [x] Show only applicable controls and contextual guidance in the section editor.
- [x] Restore monorepo type checking by adding the missing desktop Node.js types, aligning AWS SDK versions, and guarding required route parameters.
- [x] Validate and publish the simplified editor experience.

## Featured Beat Media Preservation

- [x] Trace the admin featured-toggle payload and beat-update persistence path.
- [x] Preserve existing artwork and media keys when only featured status changes.
- [x] Add regression coverage, validate, and publish the fix.

## Full-Site Page Builder and Navigation Management

- [x] Audit every public page, existing navigation link, and current builder-page behavior.
- [x] Define saved page visibility, navigation-order, and advanced section-layout settings.
- [x] Bring existing public pages under the Page Builder without changing their canonical routes.
- [x] Add configurable navigation visibility, labels, and drag-free ordering controls.
- [x] Add advanced section layout, spacing, emphasis, and visual treatment controls.
- [x] Apply saved builder settings to public pages and the live site navigation.
- [x] Add regression coverage, validate, and publish the full-site builder expansion.

## Comprehensive Site Builder Expansion

- [x] Preserve existing page builder, SEO, navigation, Fourthwall, and email capabilities while expanding the configuration model.
- [x] Add global header, footer, social-link, and utility-navigation configuration.
- [x] Add reusable headline, text, image, video, gallery, callout, divider, and spacer section capabilities.
- [x] Add media sizing, fit, overlay, alignment, spacing, width, background, and column layout controls.
- [x] Add page-level layout and visibility controls for all public marketing routes.
- [x] Render the saved design system across public pages, header, footer, and navigation.
- [x] Add migration safeguards, regression coverage, validation, and deployment-ready review materials.

## PR #22 Conflict Resolution

- [x] Inspect the latest main changes and identify the conflicting Site Builder files.
- [x] Rebase the comprehensive Site Builder branch and reconcile all conflicts.
- [x] Revalidate the resolved branch and confirm PR #22 is mergeable.

## Page Builder Image Uploads

- [x] Audit the existing authenticated media-upload and storage-key workflow.
- [x] Add secure Page Builder image upload validation and persistence support.
- [x] Add image upload, preview, replacement, and removal controls to the Site Builder.
- [x] Add regression coverage, validate, and publish the upload workflow.

## Fourthwall Product Image Galleries

- [x] Inspect Fourthwall product image data and the current card renderer.
- [x] Add an accessible all-image gallery experience to merchandise product cards.
- [x] Validate, test, and publish the merchandise gallery update.

## Customer Accounts, Dashboard, and Catalog Access

- [x] Audit current authentication, featured-beat visibility, full-catalog, cart, and checkout behavior.
- [x] Define customer-account, session, library, insights, and marketing-preference data structures.
- [x] Add secure customer registration, login, logout, and authenticated-session handling.
- [x] Require customer sign-in for the full beat catalog and purchase flow while retaining public featured beats.
- [x] Build an authenticated customer dashboard with purchase insights, license library, newsletter preference, and relevant upsells.
- [x] Add security and behavior regression coverage, validate, and publish the account experience.

## Shared Customer Portal Service

- [x] Audit the mobile app and web purchase, order, fulfillment, and download paths that must use one backend authority.
- [x] Define shared customer identity, order ownership, entitlement, session, and download-authorization contracts for mobile and web clients.
- [x] Implement shared mobile-first customer portal routes and services for every client surface.
- [x] Bind mobile sign-in, account dashboard, purchases, entitlement library, and downloads to the shared service.
- [x] Bind web checkout, customer dashboard, catalog access, and downloads to the same shared service.
- [x] Add cross-client authorization and entitlement regression coverage, validate, and publish the shared portal service.

## Shared Customer Portal PR Conflict Resolution

- [x] Inspect the current main-branch divergence and identify all PR #27 conflicts.
- [x] Resolve the shared portal conflicts while retaining current main-branch enhancements.
- [x] Revalidate the merged change set and update PR #27 for review.

## Admin Upload Repair

- [x] Trace the failing admin-panel upload request through browser controls, authorization, API validation, and storage.
- [x] Repair the upload path and present actionable configuration feedback when storage is unavailable.
- [x] Add regression coverage, validate the repaired workflow, and include it in the PR #27 update.

## Vercel Production Configuration

- [x] Verify that the supplied credential authenticates, then identify that it lacks access to the team-owned deployment project.
- [ ] Obtain an authorized Vercel credential with access to the team that owns the deployment.
- [x] Verify the latest supplied Vercel credential against the team-owned project; it still lacks the necessary team-project access.
- [x] Verify the newly supplied Vercel credential against the team-owned project; it still lacks the necessary team-project access.
- [x] Retry the Vercel project access and configuration inspection after the user’s environment update.
- [ ] Inspect the Vercel project deployment, runtime, route, and environment-variable configuration without exposing secrets.
- [ ] Apply safe configuration fixes that activate the deployed API and do not require unavailable object-storage values.
- [ ] Verify deployment readiness and report any remaining storage configuration requirements.

## Artwork Image Upload Verification

- [x] Verify artwork upload controls, accepted MIME types, size limits, and presign routing.
- [ ] Confirm artwork uploads use the production Render storage variables and R2 CORS policy.
- [ ] Validate one authenticated artwork image upload end to end.

## Render Production Upload Configuration

- [x] Inspect the Render service and current environment-variable configuration without exposing secret values.
- [x] Confirm the Render API and R2-compatible storage configuration is correct for artwork uploads.
- [ ] Verify the corrected production deployment and authenticated artwork upload readiness.

## Cloudflare R2 CORS Verification

- [x] Inspect the Cloudflare account and R2 bucket CORS policy without exposing credentials.
- [x] Correct the R2 CORS policy for the production artwork-upload origins and signed PUT headers if needed.
- [x] Verify the final CORS policy and authenticated artwork-upload readiness.

## Featured Cards and Page Builder Usability

- [x] Inspect and document the rendered pixel dimensions and aspect ratio for the Instant Delivery, Clear Licensing, and Studio Quality featured cards.
- [x] Repair the Instant Delivery featured-card image upload path and add targeted validation feedback.
- [x] Add selectable social-platform icons to each Page Builder social link.
- [x] Replace pipe-character social-link and related builder controls with visual, labeled controls.
- [x] Add regression coverage and validate the updated builder and featured-card workflows.

## Full Mobile Website Builder Redesign

- [x] Audit and document mobile-builder patterns for canvas editing, responsive previews, section navigation, styling, reusable blocks, and publishing flows.
- [x] Design a backward-compatible builder workspace and content model for device-specific settings, global styles, and reusable sections.
- [x] Implement the mobile-first visual canvas, device previews, section navigator, drag/reorder affordances, and contextual editing controls.
- [x] Add advanced style presets, typography, spacing, color, background, media, navigation, global header/footer, reusable blocks, and publishing safeguards.
- [x] Validate the redesigned builder with lint, type checks, tests, and production build; visual capture was blocked because the active preview workspace has no matching Page Builder preview URL.

## Builder Studio History and Publishing

- [x] Audit the existing persistence API and page data model for backward-compatible editor history, drafts, templates, and versions.
- [x] Implement touch-friendly drag/reorder with keyboard-accessible fallbacks and undo/redo history.
- [x] Add autosave drafts with clear saved/unsaved/error states.
- [x] Add reusable saved section templates and insertion controls.
- [x] Add publish checkpoints and version history with safe restore behavior.
- [x] Validate the expanded Builder Studio with interaction tests, type checks, lint, build, and isolated tests.

## Repository Health Audit

- [x] Inspect branch/worktree state, recent merge history, and unresolved conflict markers.
- [x] Run lint, type checks, production builds, isolated tests, dependency audits, and configuration checks across all workspaces.
- [x] Investigate confirmed failures and high-risk paths in authentication, uploads, payments, customer portal, Builder Studio, and deployment.
- [x] Apply safe fixes and add regression coverage for confirmed bugs.
- [x] Re-run the complete validation suite and document prioritized findings.

## Website Run Request

- [ ] Inspect current repository, deployment configuration, and production platform state.
- [ ] Identify the blocker preventing the website from running.
- [ ] Repair confirmed startup, routing, build, or deployment issues.
- [ ] Validate local and production-facing website flows.
- [ ] Report running status and any remaining manual action.

## Complete PR #38 Production Repair

- [ ] Review PR #38 and confirm the release checks and Dockerfile diff.
- [ ] Merge PR #38 and monitor the configured production deployment.
- [ ] Verify live API, homepage, verification route, storage configuration, and upload authorization.
- [ ] Report the completed production repair and any remaining configuration action.

## Production Deployment Repair

- [x] Audit merged-main deployment configuration, CI workflows, and production service routing.
- [x] Identify and repair the concrete deployment or environment propagation blocker.
- [x] Prepare the production release through the configured workflow without destructive changes.
- [ ] Verify live verification, R2 configuration, homepage, API health, and upload authorization.
- [ ] Report completed repairs and any remaining user-controlled production action.

## Post-Merge Production Verification

- [ ] Confirm PR #37 merge and identify the resulting production deployment.
- [ ] Check live API, verification route, and storage configuration behavior.
- [ ] Report whether production is updated and identify any remaining deployment action.

## Production R2 Storage Configuration

- [x] Map application R2 variables, storage helpers, deployment manifests, and current configuration.
- [x] Determine the required R2 bucket, endpoint, public URL, and CORS values.
- [x] Add or request production environment settings through the secure configuration path.
- [x] Validate storage configuration, upload signing, CORS, and production-facing routes.
- [ ] Report configured values, remaining secret requirements, and next deployment action.

## Environment Variable Verification

- [x] Inspect local and deployment configuration for required email and production variable names.
- [x] Check configured environment availability without exposing secret values.
- [ ] Report loaded, missing, and production-confirmation-required variables.

## Release Review and Checkpoint

- [x] Review all pending verification, newsletter, mobile, builder, and deployment changes.
- [x] Resolve release blockers and confirm the production-ready file set.
- [x] Create a release checkpoint and commit the reviewed changes.
- [ ] Prepare the configured merge or Publish workflow without auto-publishing.
- [ ] Report the checkpoint, commit, and final user-controlled release action.

## Production Deployment of Email Verification

- [x] Inspect deployment branch, manifests, production service, and required email environment configuration.
- [ ] Prepare the validated verification release and required production email configuration.
- [ ] Deploy through the configured production workflow without changing unrelated DNS or data.
- [ ] Verify the live homepage, API, verification route, and production logs.
- [ ] Report deployment status and any required user action.

## DNS Repair

- [x] Inspect current apex and www DNS, SSL, Cloudflare, and Render domain configuration.
- [x] Identify the exact apex-domain routing or certificate misconfiguration.
- [x] Apply the minimal DNS, SSL, or domain-routing repair.
- [x] Verify apex, www, API health, and redirect behavior.

## Newsletter Popup and Account Email Verification

- [x] Resume newsletter popup form implementation with public rendering and Builder Studio controls.

- [x] Inspect the existing Builder Studio, global site settings, customer authentication, email delivery, and database models.
- [x] Define popup customization, consent, deduplication, verification-token, and mailing-list data flows.
- [x] Add configurable newsletter popup rendering and Builder Studio controls.
- [x] Add newsletter signup persistence, consent handling, and admin mailing-list visibility/export support.
- [x] Add account email verification with secure expiring tokens and verified-state enforcement.
- [x] Share verification state and API behavior across the website and Expo app.
- [x] Add mobile verification and resend UI states using the shared backend.
- [x] Add regression tests and validate public signup, account signup, verification, and admin flows.

## Direct GitHub Builder Studio Implementation

- [ ] Inspect the GitHub repository’s current Builder Studio model, admin editor, and live renderer.
- [ ] Add the Content, Style, and Advanced section inspector tabs directly to the GitHub source.
- [ ] Add backward-compatible anchor IDs, custom CSS hooks, and accessibility labels to section data, validation, and rendering.
- [ ] Run the repository typecheck, tests, lint, and production build.
- [ ] Commit and push the validated Builder Studio changes to the GitHub repository.
- [ ] Report the pushed revision and deployment handoff.

## Final Direct GitHub Review

- [x] Review the existing GitHub worktree and compare it against the intended Builder Studio implementation.
- [x] Finish and correct the Builder Studio implementation in the GitHub repository.
- [x] Run the complete repository validation suite and inspect the final diff for regressions.
- [x] Commit and push the validated implementation to GitHub.
- [x] Report the pushed revision and deployment handoff.

## Builder Upload and Beat Metadata Repair

- [x] Inspect the Clear Licensing image upload path, storage keys, signed URLs, and live section rendering.
- [x] Repair Builder Studio image upload persistence and rendering for Clear Licensing and other image-backed sections.
- [x] Audit beat metadata fields, upload form payloads, validation, persistence, and public/admin display.
- [x] Repair existing beat metadata safely and enforce correct metadata on future uploads.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified upload and metadata fixes to GitHub.
- [x] Report the pushed revision and deployment handoff.

## Circular JSON Frontend Error Repair

- [x] Inspect JSON serialization, API request helpers, upload handlers, and Builder Studio event handlers.
- [x] Identify and repair any path passing a DOM or React event into JSON.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified circular JSON repair to GitHub.
- [x] Report the pushed revision and deployment handoff.

## Beat Vault and Navigation Repair

- [x] Inspect Beat Vault routes, data loading, visibility filters, and navigation configuration.
- [x] Repair Beat Vault beat loading and remove the All Beats navigation item.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified Beat Vault and navigation fixes to GitHub.
- [x] Report the pushed revision and deployment handoff.

## Beat Vault Root-Cause Diagnosis

- [x] Verify the live deployment revision, Beat Vault saved page settings, beat database records, and public API response.
- [x] Repair the confirmed root cause across data, page configuration, API, or rendering.
- [x] Add regression coverage and run the complete validation and final diff review.
- [x] Commit and push the verified Beat Vault repair to GitHub.
- [x] Report the exact deployment requirement and verification result.

- [x] Remove saved header CTA instances labeled All Beats, not only page-navigation entries.
- [x] Verify the live Beat Vault’s public featured preview and authenticated full-catalog behavior against the user’s expected catalog visibility.

## Post-Deployment Remaining Issues

- [x] Verify the newly deployed live Beat Vault, navigation, uploads, and browser/runtime behavior.
- [x] Fix each confirmed remaining issue directly in the GitHub source.
- [x] Run regression tests, typecheck, lint, production build, and final diff review.
- [x] Commit and push the verified post-deployment fixes to GitHub.
- [x] Report live verification status and any required deployment follow-up.

## Beat Vault Missing User Beats Diagnosis

- [ ] Verify the live Beat Vault output, public API response, database beat records, and visibility fields.
- [ ] Fix the confirmed data, visibility, API, page configuration, or rendering cause directly in GitHub.
- [ ] Run regression tests, typecheck, lint, production build, and final diff review.
- [ ] Commit and push the verified Beat Vault repair to GitHub.
- [ ] Report the exact deployment verification result.

## Email Verification Redirect Repair

- [ ] Inspect verification email generation, callback route, frontend routes, and existing tests.
- [ ] Implement a secure verification completion page and redirect flow with success and failure states.
- [ ] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [ ] Commit and push the verified email-verification redirect repair to GitHub.
- [ ] Report the deployment and verification behavior.

## Customer Catalog Access Update

- [x] Redirect GET email verification links back to the website with success or failure status.
- [x] Allow authenticated customer accounts to browse the full published beat catalog without email verification.
- [x] Keep email verification required for purchasing, checkout, entitlements, and downloads.
- [x] Add regression coverage and run full repository validation.
- [x] Commit and push the verified access-control update to GitHub.

- [x] Verify every Beat Vault artwork URL and image element loads from the deployed storage path.
- [x] Repair artwork URL normalization, signing, fallback rendering, or card image behavior as needed.

## Builder Studio Upload, Save, and Page Metadata Repair

- [x] Audit all Builder Studio upload handlers, storage URL normalization, Save Changes mutation, settings persistence, and live rendering.
- [x] Fix Clear Licensing and shared Builder Studio upload/save persistence paths.
- [x] Add editable page titles and descriptions with backward-compatible metadata rendering.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified Builder Studio repair to GitHub.

## R2 Production Upload Repair

- [x] Inspect R2 CORS configuration, presigned upload generation, browser upload headers, and production origins.
- [x] Repair the R2 upload flow and configure allowed production origins and headers.
- [x] Run upload-focused tests, full validation, and final diff review.
- [x] Commit and push the verified R2 upload repair and report any required Cloudflare deployment step.

## Builder Studio Style System Expansion

- [x] Audit the current section style model, Style tab controls, shared defaults, and live renderer.
- [x] Add backward-compatible section style tokens for palette, typography, spacing, sizing, borders, and layout effects.
- [x] Build the visual Style tab controls and apply the new settings to live section rendering.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified Style tab expansion to GitHub.

## Builder Studio Merch Settings Consolidation

- [x] Remove the standalone Fourthwall settings editor from the bottom of Builder Studio.
- [x] Expose the relevant Fourthwall storefront settings within the Merch page or Merch section editor.
- [x] Preserve existing saved Fourthwall configuration and live merch behavior.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified Merch settings consolidation to GitHub.

## Builder Studio Custom Color and Font Controls

- [x] Audit current section style fields, font presets, Style tab controls, and live CSS rendering.
- [x] Add backward-compatible custom color and font fields with server validation.
- [x] Build hex and color-picker controls, expanded font selection, and live section styling.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and final diff review.
- [x] Commit and push the verified custom color and font expansion to GitHub.

## Clear Licensing Card Image Upload Repair

- [x] Trace the Clear Licensing image editor state, upload/proxy flow, save payload, persistence, and live renderer.
- [x] Fix the root cause so uploaded Clear Licensing artwork survives save and displays on the live site.
- [x] Add or update regression coverage for the Clear Licensing upload/save path.
- [x] Run targeted tests, typecheck, lint, build, and final diff/conflict review. The focused checks pass; three pre-existing URL-sign tests fail under the current injected storage environment.
- [x] Commit and push the verified Clear Licensing upload repair to GitHub.

User-reported issue: Clear Licensing card image uploads do not save to the live site. Preserve existing builder customization, same-origin storage proxy, accessible controls, and mobile layout.
Parallel investigation list: page-builder upload/state, admin API persistence/storage, managed-page renderer/tests.
Repository constraint: work directly in Vylanous/Vylanous-Beats; do not create a Manus checkpoint.

## Press Kit Analytics Block

- [x] Audit existing Press Kit section support, Add Block registry, editor controls, and public renderer.
- [x] Add backward-compatible Press Kit platform, content, audience, and location data fields with server validation.
- [x] Build the Press Kit editor controls and responsive public stats rendering.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and conflict review. The focused tests, typecheck, lint, and build pass; three existing URL-sign fixtures fail under the current injected storage environment.
- [x] Commit and push the Press Kit block directly to GitHub main.

User request: add a Page Builder Add Block called Press Kit for YouTube, TikTok, Facebook, Instagram, and other platforms with followers/subscribers, videos uploaded, audience gender, demographics, locations, and additional analytics.
Scope: start with explicit editable metrics and audience data; do not fabricate analytics or claim live API data unless a verified connector is configured.

## Linked Press Kit Social Profiles

- [ ] Audit Press Kit profile selection, social URL handling, persistence, and public links.
- [ ] Link each Press Kit stats card to a selected social profile with reliable platform and URL behavior.
- [ ] Add regression coverage and validate saved profile links, stats association, renderer links, and mobile layout.
- [ ] Commit and push the linked Press Kit stats update to GitHub main.

User request: make Press Kit stats update with the chosen social profiles and ensure selected social profiles link correctly to their stats.

## Page Section Style Tab Overhaul

- [x] Audit the current Style tab, page layout settings, global chrome settings, and public renderer.
- [x] Add backward-compatible page-level primary, background, eyebrow, and chrome-link style fields with server validation.
- [x] Rebuild the Style tab into visual grouped controls with understandable labels, previews, reset actions, and mobile-friendly layout.
- [x] Apply page-level colors and header/navigation/footer linkage in the public renderer.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and visual checks. The relevant checks passed; the requested admin screenshot route was unavailable in the managed preview.
- [x] Commit and push the Style tab overhaul directly to GitHub main.

User request: make the Page Sections Style tab much easier to use; add a true main color changer, background color, eyebrow font color, and per-page linkage to navigation, footer, and header styling.

## Save Site Settings Error

- [x] Trace the Save Site Settings client error handler, request payload, and server validation response.
- [x] Fix the underlying save failure and replace object-stringified errors with actionable messages.
- [x] Add regression coverage and validate save behavior, typecheck, lint, build, and diff checks.
- [x] Commit and push the Save Site Settings repair directly to GitHub main.

User report: saving Site Settings displays `[object Object]` instead of a useful error message.

## Hierarchical Page Navigation

- [x] Audit page hierarchy, routing, Builder settings, and global header/footer navigation.
- [x] Add backward-compatible parent-page and local sub-navigation settings with server validation.
- [x] Add intuitive parent-page, global visibility, and local sub-navigation controls to the Page Builder.
- [x] Render nested URLs and responsive local sub-navigation while excluding hidden child pages from global header/footer links.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and diff checks.
- [x] Commit and push the hierarchical sub-navigation feature directly to GitHub main.

User request: support child pages such as `/artist/blog`, allow pages to be hidden from the global header/footer, and optionally show child-page links as a local sub-navigation menu on their parent section.

## Page Builder Workflow Cleanup and Font Library

- [x] Audit the Builder workspace, style controls, typography model, available fonts, and redundant options.
- [x] Add a curated 50-font library and migrate saved font selections with backward compatibility.
- [x] Reorganize the Builder controls into a workflow-first layout and remove redundant typography options.
- [x] Apply selected fonts reliably in public rendering while preserving existing page and section color controls.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and visual review.
- [x] Commit and push the Builder cleanup and font library directly to GitHub main.

User request: replace abstract typography labels such as Brand, Editorial, and Mono with 50 practical font options, including Anton, Barlow Condensed, and Arial Narrow; retain every color customization option; remove unnecessary controls; and make the Builder layout clean and organized.

Additional request: add a safe Page Builder page-deletion option, protect core system pages, and handle child pages clearly when their parent is deleted.

## Repository-Wide Production Readiness Audit

- [x] Inventory repository structure, scripts, dependencies, environment handling, existing test coverage, and current Git status.
- [x] Audit customer storefront, catalog, checkout, entitlement, download, authentication, and content rendering flows.
- [x] Audit admin customization, page builder, uploads, settings persistence, routing, navigation, and error handling.
- [x] Audit API validation, storage, email, configuration, dependencies, and production build tooling.
- [x] Implement verified fixes with targeted regression coverage.
- [x] Run full relevant tests, typecheck, lint, production build, route checks, and final diff/conflict review.
- [x] Commit and push the verified production-readiness repairs directly to GitHub main.

User request: review the entire Vylanous Beats repository for code errors, likely future failures, bugs, clutter, and customer/admin journey risks; repair verified issues while reporting any external operational dependencies honestly.

## Artist Page Builder Route Repair

- [x] Inspect saved Artist page settings, path normalization, router matching, public settings, and deployed route behavior.
- [x] Repair `/artist` routing without disrupting existing top-level or nested Builder pages.
- [x] Add regression coverage and validate direct, nested, and fallback Builder page routing.
- [x] Commit and push the Artist page-route repair directly to GitHub main.

User report: `vylanous.com/artist` does not open the Page Builder page created for the Artist landing page.

Live finding: `/api/settings` returns a published `page_artist` at `/artist` with the intended Artist sections, but the live `/artist` client renders the managed home content. The router wildcard currently resolves an empty path parameter, causing the managed renderer to fall back to `/`.

Expanded requirement: ensure every designated published Page Builder page, including top-level and nested paths, routes to its saved managed content while protected system routes retain their intended application screens.

## Page Background and Visual Treatments

- [x] Audit current page-level style settings, upload controls, public layout rendering, and CSS variable coverage.
- [x] Add backward-compatible page background image, overlay, placement, and treatment settings with server validation.
- [x] Add Style tab controls for page background color, background image upload, overlay strength, image behavior, and page-specific visual treatments.
- [x] Apply the configured page background and treatments in the public renderer with responsive and accessible behavior.
- [x] Add regression coverage and run typecheck, tests, lint, production build, and visual review. Automated validation passed; the managed preview workspace does not serve this repository’s Builder route for a representative visual capture.
- [x] Commit and push the page background customization update directly to GitHub main.

User request: retain the existing color customization while adding a real page background color control, an uploaded page background image, and additional page-level options that make each Builder page visually distinct.

## Builder Inline Text Formatting

- [x] Add selection-based Bold, Italic, and Underline controls to the Page Section text-content editor.
- [x] Persist formatted body copy with backward-compatible server validation and render it safely without raw HTML.
- [x] Add parser regression coverage and include the feature in the full validation suite.
- [x] Commit and push the formatted text-control update directly to GitHub main.

User request: allow individual parts of the text body entered for Page Sections to be bold, italic, or underlined on every Builder page.

## Artist Blog Nested Route Diagnosis

- [x] Inspect saved Artist and Blog Builder-page settings, generated nested paths, and route matching behavior. The parent Artist page and its generated `/artist/blog` links are correct; direct production access to `/artist/blog` reaches the application 404 page.
- [x] Identify and repair the confirmed nested Artist Blog routing cause, if code is responsible. Confirmed source cause: the Wouter pattern `/:rest*` accepts only one URL segment, so it matches `/artist` but not `/artist/blog`; the catch-all now uses the parser’s `/*` wildcard form.
- [x] Add regression coverage and run relevant tests, typecheck, lint, production build, and final diff review. Targeted route tests, the full isolated suite, typecheck, lint, and production build pass.
- [x] Commit and push the verified nested Artist Blog routing repair directly to GitHub main.

User report: the Blog page nested within the Artist page is not routing properly.

## Builder Rich-Text Live Preview Repair

- [x] Inspect the current formatted text editor, preview rendering path, and parser behavior. The responsive Builder canvas displayed raw formatting markers, and the editor provided no formatted text preview while typing.
- [x] Add an accessible live Bold, Italic, and Underline preview that updates while content is typed. The same safe formatting now renders in both the editor preview and device canvas.
- [x] Add regression coverage and run relevant tests, typecheck, lint, production build, and final diff review. The existing parser regression coverage plus the full isolated suite, typecheck, lint, and production build pass.
- [x] Commit and push the verified live-preview repair directly to GitHub main.

User report: Bold, Italic, and Underline controls do not show a live preview while text is being entered in the Page Builder.

## Builder Two-Segment Child-Page Paths

- [x] Verify page-path editor validation, persistence, parent-child settings, and public routing for user-entered two-segment URLs. The URL Path input preserves entries such as `/artist/blog`; server validation permits them; path normalization retains both segments; and the public `/*` Builder fallback resolves them.
- [x] Repair any confirmed two-segment child-page path handling gap. No additional runtime repair was required after the nested wildcard fix; direct coverage now verifies raw and trailing-slash two-segment URL Path entries normalize to `/artist/blog`.
- [x] Add regression coverage and run relevant tests, typecheck, lint, production build, and final diff review. Targeted path tests, the full isolated suite, typecheck, lint, and production build pass.
- [x] Commit and push the verified two-segment Builder path support and regression coverage directly to GitHub main.

User request: confirm that Builder child pages load from a two-segment URL entered in the URL Path field, such as `/artist/blog`.

## Builder Independent Typography Controls

- [x] Audit section typography fields, Style tab controls, validation, and public text rendering.
- [x] Add a body-copy font selection independent from the heading font, with backward-compatible persistence.
- [x] Replace abstract typography sizing with direct eyebrow, heading, and body text-size controls.
- [x] Add regression coverage and run relevant tests, typecheck, lint, production build, and final diff review. The full isolated suite, typecheck, lint, and production build pass.
- [x] Commit and push the verified typography controls directly to GitHub main.

User request: allow body text to use a different font from headers and provide direct text-size controls instead of abstract styles such as relaxed or condensed.

## Builder Rich-Text Formatting Repair

- [x] Inspect selection handling, marker insertion, parsing, editor preview, and public rendering for Bold, Italic, and Underline. The toolbar made separate body and format updates in one React event, allowing a stale update to overwrite the inserted marker text; it also ignored cursor-only formatting.
- [x] Repair the confirmed rich-text interaction defect and add clear formatting-state feedback. Formatting now saves body text and inline state atomically, supports both selections and cursor insertion, and confirms the applied formatting state.
- [x] Add focused regression coverage and run tests, typecheck, lint, production build, and final diff review. Focused formatting tests, the full isolated suite, typecheck, lint, and production build pass.
- [x] Commit and push the verified rich-text formatting repair directly to GitHub main.

User report: the Page Builder Bold, Italic, and Underline controls are not working correctly.

## Builder Direct Rich-Text Editor Repair

- [x] Reproduce the persistent Bold, Italic, and Underline interaction failure in the actual Builder editor. The prior control attached formatting markers to a plain textarea, which cannot display in-place formatting and was dependent on fragile selection restoration.
- [x] Replace the unreliable marker-only input flow with a direct in-place formatting editor. The Editor now applies Bold, Italic, and Underline directly within the editable typing surface while serializing only the limited safe marker set for storage.
- [x] Add regression coverage and run browser interaction verification, tests, typecheck, lint, production build, and final diff review. Automated tests, typecheck, lint, and production build passed; browser interaction verification was blocked by the owner-password-protected local Admin Studio route.
- [x] Commit and push the verified direct rich-text editor repair directly to GitHub main.

User report: the previous Bold, Italic, and Underline repair still does not work in the Page Builder.

## Builder Desktop Editor on Mobile Browser

- [x] Inspect the desktop editor’s rich-text toolbar and touch selection behavior when viewed through a mobile browser. The desktop toolbar prevented mouse focus transfer only; touch pointer events could still collapse a selected text range before the control action ran.
- [x] Repair the mobile-browser desktop-editor formatting interaction while preserving the working mobile-site view. Toolbar pointer events now preserve the editor selection, and controls wrap with mobile-friendly touch targets.
- [x] Verify at mobile browser width and run tests, typecheck, lint, production build, and final diff review. Local Admin Studio was confirmed to load but is owner-password protected; source-level touch behavior plus the full automated suite, typecheck, lint, and production build pass.
- [x] Commit and push the verified responsive desktop-editor repair directly to GitHub main.

User clarification: rich-text formatting works in the mobile site view, but not when the desktop editor is used from a mobile browser.

## Builder Visual Treatments, Covers, and Banners

- [x] Audit existing section borders, glow styling, 16:9 media capabilities, upload flow, and page-level announcement settings.
- [x] Add enhanced border styles, configurable glow colors, and optional moving or slow-flashing glow animations.
- [x] Add dedicated 16:9 image and video cover settings in Page Sections.
- [x] Add configurable announcement banners that can display on every page or only chosen Builder pages.
- [x] Add regression coverage and run interaction checks, tests, typecheck, lint, production build, and final diff review. The local admin view remains password-protected; automated migration coverage, typecheck, lint, and production build pass.
- [x] Commit and push the verified Builder visual-treatment update directly to GitHub main.

User request: add richer animated borders and glow effects, 16:9 image/video covers, and targeted sales or announcement banners in the Page Builder.

## Builder Page Deletion Persistence Repair

- [x] Inspect the EPK delete action, current-page state, saved settings payload, and page merge behavior. The seeded EPK page returned because the settings merger always re-added default pages missing from the saved page list.
- [x] Repair deletion persistence so pressing Delete and saving settings permanently removes a non-system Builder page. Deleted seeded page IDs now persist as tombstones, and the Save Site Settings payload sends them to the API.
- [x] Add regression coverage and include the deletion flow in final validation.
- [x] Commit and push the combined visual-treatment and persistent page-deletion repair directly to GitHub main.

User report: the EPK page does not delete correctly from the Page Builder after the delete action and settings save.

### Verified audit findings to repair

- [x] Restrict the public featured endpoint to featured beats only and prevent unpublished beats from being auto-published by read requests.
- [x] Remove signed download URLs from unverified customer dashboard responses while retaining verified download access.
- [x] Ensure delivery emails always use a valid public-site URL fallback.
- [x] Keep mobile exclusive-purchase fulfillment consistent with web fulfillment by removing the beat from public sale.
- [x] Validate checkout before order creation, reject duplicate/unpublished cart items, and prevent orphan pending orders when Stripe is unavailable or session creation fails.
- [x] Restrict credentialed API CORS to configured public origins and add safe runtime readiness reporting without leaking secrets.
- [x] Update high-risk direct web dependencies identified by the package audit where compatible and covered by validation.

## Artist Page Color Isolation and Deletion Repair

- [x] Audit page-level color inheritance, the Color Mood control, and the complete page-deletion persistence flow. The server Save Site Settings merge was dropping deletedPageIds, and page CSS had purple fallbacks.
- [x] Remove Color Mood and add full page-specific color overrides without inherited purple accents or shared storefront aesthetics. Isolated pages now expose primary, background, text, muted, surface, border, eyebrow, and link colors.
- [x] Repair deletion persistence so deleted Builder pages remain removed after Save Site Settings and reload. The API now preserves deletedPageIds during its merge before writing settings.
- [x] Add regression coverage and run tests, typecheck, lint, production build, and final diff review. Full isolated suite: 42 passing; typecheck, lint, and production build pass.
- [x] Commit and push the verified page customization and deletion repair directly to GitHub main.

User report: the Artist page must not inherit purple or other shared accents; Color Mood is unwanted; and page deletion remains unfixed.

## Universal Border Colors, Artist Wordmark, and Section Logos

- [x] Audit border/glow CSS mappings, page color variables, Artist wordmark rendering, and section logo data paths.
- [x] Make configured page glow and border colors apply to every border style across all Builder pages.
- [x] Change the Artist page wordmark to VYLANOUS ARTIST with ARTIST rendered in red.
- [x] Add an upload option for a custom logo on each Page Section and render it publicly.
- [x] Add regression coverage and run focused tests and formatting checks; full typecheck remains blocked by pre-existing monorepo errors.
- [ ] Commit and push the verified universal color and logo update directly to GitHub main.

User request: border glow colors remain purple for other border styles; change the Artist wordmark to VYLANOUS ARTIST with Artist in red; and allow a different logo upload for each page section.

## Per-Page Wordmark Control

- [x] Add a Builder page-level wordmark field with global-wordmark fallback.
- [x] Render the configured wordmark in the page header and support the Artist page value "VYLANOUS ARTIST".
- [x] Add regression coverage and include per-page wordmarks in final validation.

## Responsive Layout Simplification

- [ ] Audit the blank side-space issue and identify desktop/mobile viewport and section-width causes.
- [ ] Remove manual standard/wide/full-width section sizing controls from the Builder UI and normalize saved legacy values.
- [ ] Make public sections fluid and device-native across mobile, tablet, and desktop without horizontal overflow or blank side rails.
- [ ] Validate responsive rendering at mobile, tablet, and desktop widths and add regression coverage.
- [ ] Save a checkpoint for the responsive layout repair.

## Universal and Page Settings Builder Workspaces

- [x] Audit the current Page Builder workspace, global settings, page settings, and renderer merge behavior.
- [x] Add Universal Settings and Page Settings tabs without removing existing Builder capabilities.
- [x] Make page-specific settings explicitly override universal defaults while preserving inherited values when unset.
- [x] Condense repeated controls into simpler grouped sections and clarify setting scope in labels.
- [x] Validate page creation, universal settings, page overrides, responsive rendering, and existing Builder features.
- [ ] Save a checkpoint for the reorganized Page Builder.

## Clear Licensing Artwork Persistence Repair

- [x] Trace Clear Licensing artwork upload, settings save, migration, and public rendering paths.
- [x] Fix the confirmed persistence or rendering defect without removing existing artwork.
- [x] Add regression coverage proving Clear Licensing artwork survives save, reload, and settings migration.
- [x] Validate the web package and save a checkpoint for the permanent artwork repair.

## Admin Media Health Check and Per-Page Chrome Branding

- [x] Audit stored media references, storage signing, page layout models, admin APIs, and header/footer renderers.
- [x] Add an admin Media Health Check that reports broken, missing, external, and healthy media references with actionable context.
- [x] Add per-page header logo, footer logo, header label, and footer label settings to Custom Page Settings and persist them safely.
- [x] Render page-specific header/footer branding with universal fallback, including the Artist page example.
- [x] Add regression coverage and validate health reporting, uploads, persistence, and public rendering.
- [x] Save a checkpoint for the Media Health Check and page chrome branding work.

## Per-Page Header Actions and Cart Visibility

- [x] Audit the universal header action settings, public header renderer, mobile menu, and Custom Page Settings structure.
- [x] Add page-level optional overrides for Beats Vault, Sign In, and shopping cart visibility with universal inheritance.
- [x] Add compact controls for action visibility, labels, and links in Custom Page Settings.
- [x] Render page-specific header action overrides consistently on desktop and mobile navigation.
- [x] Add regression coverage and validate inheritance, visibility combinations, and production build.
- [x] Save a checkpoint for the per-page header action controls.

## Header Cart Dropdown and Buy Now

- [x] Audit current cart state, header trigger, cart drawer, and checkout behavior.
- [x] Add a header cart dropdown showing current items, remove controls, totals, and a Buy Now action.
- [x] Keep cart state synchronized with the existing cart drawer and checkout flow.
- [x] Validate desktop, mobile, accessibility, empty-cart, removal, and checkout behavior.
- [x] Save a checkpoint for the header cart dropdown.

## GitHub-Only Release and Workspace Cleanup

- [ ] Audit the Vylanous/Vylanous-beats checkout, branch state, uncommitted changes, and commits from the past two days.
- [ ] Reconcile and validate the requested Builder, media, branding, header action, and cart changes directly in the GitHub repository.
- [x] Commit the verified past-two-days changes to the repository and push them to `main`.
- [ ] Verify the configured live deployment workflow and production revision.

## Automatic Vercel Deployment Configuration

- [x] Confirm Vercel project `prj_EHMEyY9jzAh8Q2mo73FaCwPiCi0j` is not the live hosting target; live hosting is Render.
- [x] Retire the incorrect Vercel deployment approach and switch the plan to Render.
- [x] Configure the selected automatic deployment path without exposing secrets using the masked `RENDER_DEPLOY_HOOK_URL` GitHub secret.
- [x] Native Vercel access remains unavailable; use a non-browser token-based deployment path with the confirmed GitHub secret names and values.
- [x] Validate the Render future-push deployment trigger and document the production status check; GitHub Actions run 32480327511 passed and Render accepted the deploy hook.
- [x] Preserve all Manus workspace files; do not delete the Manus workspace or its contents.
- [x] Stop using the Manus workspace for implementation; no Manus workspace files were changed or deleted.

## Cart, Social Links, Artist Colors, and Sub-Navigation Repairs

- [x] Audit cart dropdown trigger/state, page social-link models, Artist glow/button variables, and sub-navigation URL behavior.
- [x] Repair the cart dropdown interaction and keep it synchronized with cart state and checkout.
- [x] Add per-page Header/Footer social-link controls with universal fallback.
- [x] Remove purple Artist glow and sub-navigation button fallbacks so configured red values apply consistently.
- [x] Make sub-navigation links reset the target page scroll position to the top.
- [x] Add regression coverage, validate the web build, commit/push, and verify Render deployment; 18 tests passed and Render workflow 32481705519 succeeded.

## All-Page Header Actions and Header-Only Cart Repair

- [x] Audit header action page lookup and inheritance for every managed route, the cart dropdown trigger/state, and all bottom cart drawer mounts.
- [x] Make page-specific Beats Vault visibility overrides apply correctly on every page, with universal fallback only when unset.
- [x] Repair the header cart dropdown so clicking it reliably opens current cart contents and actions.
- [x] Remove every universal bottom cart drawer mount and keep only the header cart dropdown.
- [x] Add regression coverage, validate the production build, commit/push, and verify Render deployment.

## Manus-to-GitHub Synchronization

- [x] Compare the Manus workspace product files against the GitHub checkout without modifying or deleting Manus workspace files.
- [x] Transfer only changes missing from GitHub into the Vylanous/Vylanous-Beats checkout; no additional product files were present in Manus.
- [x] Validate the consolidated GitHub working tree and inspect the final diff for unintended files.
- [x] Commit and push the consolidated changes to `main`.

## Live Render Verification and Page-Specific Social Links

- [x] Verify the latest Render deployment and test live homepage, Artist page, navigation, header cart, and API health; all live probes returned 200.
- [x] Audit the social-link model and Page Settings editor for per-page customization and creation workflows.
- [x] Allow each page to select/customize social links and create new links scoped only to that page.
- [x] Render page-scoped social links correctly in that page’s header and footer with universal fallback.
- [x] Add regression coverage, validate the production build, commit/push, and verify Render deployment; 45 tests passed and Render workflow 32513163977 succeeded.

## Page Settings Branding, Cart Dropdown, and Nested Pages

- [x] Audit current page branding destination, cart dropdown rendering/state/stacking, and Pages column ordering.
- [x] Remove per-page Rename Header and Rename Footer controls and persisted fields from the Page Settings UI/model usage.
- [x] Add a configurable URL path for the page header logo and wordmark click target.
- [x] Make the header cart dropdown visibly open and usable when clicked, including responsive stacking and shared state.
- [x] Nest child pages beneath their parent pages in the Pages column.
- [x] Add regression coverage, validate, commit/push, and verify the Render deployment.

## Wordmark and Cart Regression Repair

- [x] Audit public header wordmark rendering and cart click/open state across desktop and mobile routes.
- [x] Restore the wordmark fallback and page-specific wordmark rendering on all pages.
- [x] Repair the cart trigger/dropdown and checkout interaction so it opens reliably.
- [x] Add regression coverage, validate the production build, commit/push, and verify Render deployment.

## Universal Beats Vault Visibility Override Repair

- [x] Audit page header action persistence, settings normalization, and active-page header rendering for explicit false values.
- [x] Ensure an explicit `showVault: false` override is honored on every managed page, including Artist and nested pages.
- [x] Add regression coverage, validate the production build, commit/push, and verify Render deployment.

## Unified Social-Link Editors and Expanded Platform Icons

- [x] Audit Universal Settings and Page Settings social-link controls, data model, validation, and icon mapping.
- [x] Make Page Settings use the same social-link editing controls and platform options as Universal Settings while preserving page scoping.
- [x] Add more platform options and recognizable icons, including a cloud-style SoundCloud icon, in both editors and public rendering.
- [x] Add regression coverage, validate the production build, commit/push, and verify Render deployment.

## Independent Responsive Cart Control

- [x] Audit the mobile header cart/menu structure and visibility rules.
- [x] Keep the cart control independently visible and clickable beside the menu control.
- [x] Validate desktop and mobile header behavior, tests, production build, and Render deployment.

## Sign In Page and Full System-Page Customization

- [x] Audit system-page definitions, `/login` route composition, Home sign-in content, and Page Builder section coverage.
- [x] Add the `/login` Sign In page to Custom Page Settings without weakening authentication or redirect behavior.
- [x] Expose the Home sign-in button/section and existing system-page sections for full content, layout, style, and SEO customization.
- [x] Add regression coverage, validate routes and production build, commit/push, and verify Render deployment.

## End-to-End Cart Replacement

- [x] Audit product add-to-cart, shared cart persistence, header visibility/dropdown, cart page, removal, totals, and checkout flow.
- [x] Replace fragile cart state/UI paths with one reliable implementation if the current split behavior is the root cause.
- [x] Validate desktop and mobile add/remove/totals/navigation/checkout behavior with regression coverage and production build.
- [x] Commit, push, and verify Render deployment.

## Cart Removal and Clean Rebuild

- [x] Inventory every cart dependency, route, persistence key, header control, product action, and checkout integration.
- [x] Remove the existing cart provider, dropdown, cart page implementation, stale local storage key, and related UI paths.
- [x] Build a clean replacement cart flow with fresh state, add/remove/totals behavior, header access, cart page, and checkout.
- [x] Add regression coverage, validate responsive behavior and production build, commit/push, and verify Render deployment.

## Live Cart Dropdown Verification

- [x] Test adding a beat and license on production, viewing it in the header dropdown, removing it, and confirming the empty state.

## Repeated Cart/Menu Independence Regression

- [x] Reproduce the cart-only click failure at mobile and desktop breakpoints and audit menu event boundaries.
- [x] Decouple cart and menu controls structurally and prevent menu state from controlling cart visibility or click handling.
- [x] Validate independent cart opening, menu behavior, responsive layout, tests, production build, Render deployment, and live cart opening with the menu closed.

## Page-Specific Cart and Menu Visibility Regression

- [x] Audit page header visibility persistence, merge precedence, and cart/menu rendering after the global cart fix.
- [x] Honor explicit per-page cart and menu visibility settings independently, including Artist.
- [x] Validate enabled and disabled states across routes, tests, production build, and Render deployment.

## Controlled Cart Reset After Repeated Regression

- [x] Reproduce the cart failure on production and inventory every cart/menu render, state, and event path.
- [x] Remove competing cart visibility guards, duplicate controls, stale state, and menu coupling.
- [x] Implement one minimal deterministic cart trigger/dropdown path.
- [x] Interactively verify add, view, remove, and empty states on production at desktop and mobile sizes.
- [x] Run tests/build, commit/push, and verify Render deployment before reporting completion.

## Repository-Wide Production Hardening

- [x] Map repository structure, branch status, deployment workflow, and production health.
- [x] Run full linting, type checks, unit tests, builds, dependency review, and targeted production probes.
- [x] Fix confirmed defects, remove safe dead code, and document remaining operational risks.
- [x] Delete only merged or clearly obsolete local and remote branches after branch ancestry review.
- [x] Re-run the complete validation suite, commit/push verified fixes, and confirm the Render deployment.
- [x] Record that the remaining dependency-audit findings are transitive mobile/desktop/tooling advisories requiring planned upstream major-version upgrades rather than unsafe bulk changes.

## Cross-Viewport Cart Regression Test

- [x] Test desktop cart visibility, independent opening, add/view/total/remove/empty states, and cart-page navigation on production.
- [x] Test mobile cart visibility, independence from the menu, add/view/remove/empty states, and cart-page navigation on production.
- [x] Verify checkout gating without initiating payment and document the full regression result.
- [x] Fix the verified mobile positioning defect: after a customer scrolls to add a beat, the populated cart panel is rendered above the viewport.

## Header Navigation and Mobile Menu Repair

- [x] Inspect and restore the expected header navigation links and mobile menu dropdown control without regressing cart visibility.

## Page Settings Background Color and Texture Controls

- [x] Add Page Settings controls for page background color and selectable textures while retaining Ink and Mesh.
- [x] Add several non-purple texture treatments that layer safely with a selected page color or background image.
- [x] Ensure page-level background choices fully override inherited purple backgrounds, including the Artist page and its sections.
- [x] Add regression coverage and validate the public renderer across desktop and mobile layouts.

## Transitive Dependency Security Review

- [x] Inventory the remaining transitive dependency advisories with severity, affected versions, and dependency paths.
- [x] Determine which advisories are reachable from the deployed web/API production path versus desktop, mobile, or development-only tooling.
- [x] Identify safe remediation options and prioritize any materially exposed critical paths.

## Dependency Vulnerability Remediation

- [x] Upgrade the compatible web build and server-adjacent dependency paths that carry audited advisories.
- [x] Upgrade the Electron and desktop packaging security toolchain through a supported release set.
- [x] Upgrade the Expo and React Native dependency set with compatible mobile tooling versions.
- [x] Run the complete audit, lint, typecheck, test, and web/desktop/mobile build suite before deployment.
