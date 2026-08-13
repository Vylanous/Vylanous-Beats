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
