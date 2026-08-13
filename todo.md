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
