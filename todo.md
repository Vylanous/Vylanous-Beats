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
