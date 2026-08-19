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
