# Vylanous Beats Mobile Update Operations

## Update model

The native companion app consumes the live Vylanous backend for catalog data, artwork, customer accounts, entitlements, order history, and secure download links. Those data changes become visible after the website backend is deployed, provided the existing API contract remains compatible.

Native JavaScript and interface changes are delivered through the Expo update service. Changes to native configuration, permissions, icons, installed native libraries, SDK versions, and platform-specific settings require a new Android or iPhone binary.

## Update streams

| Audience         | Channel      | Branch       | Intended use                                                                            |
| ---------------- | ------------ | ------------ | --------------------------------------------------------------------------------------- |
| Internal testers | `preview`    | `preview`    | Test native UI, customer flows, and compatible interface updates before public release. |
| Public releases  | `production` | `production` | Deliver approved compatible JavaScript updates to published Android and iPhone builds.  |

## Automated publishing

The repository workflow `.github/workflows/mobile-update.yml` validates the mobile project and publishes an update when approved mobile-code changes are merged to `main`. A manually dispatched workflow defaults to the **preview** channel, so a release can be checked before deliberately selecting production.

The repository must contain an Actions secret named `EXPO_TOKEN`. The secret must be an Expo access token with permission to publish updates to the `vylanouss-team/vylanous-beats` project. Never commit this token to source control or mobile application configuration. The workflow always installs dependencies, type-checks the app, and validates public Expo configuration first. If the secret is absent, it fails with an explicit configuration error and does not publish an update.

## Release decision

| Change                                                                                                             | Delivery path                                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Beat catalog, artwork, price, customer order, entitlement, backend-compatible portal data                          | Website/backend deployment; the app reads the live result.                                                 |
| Native React/Expo screen, component, style, copy, or supported business logic                                      | Validate, merge to `main`, then publish an Expo update to the appropriate channel.                         |
| New native dependency, permission, deep-link/native manifest, icon/splash asset, SDK change, or app-store metadata | Build and distribute a new Android/iPhone binary; submit the binary through the app store when applicable. |

## Before production publication

Confirm the preview build passes real-device tests for sign-in, customer verification, featured discovery, full signed-in catalog, beat preview audio, cart, purchase, license library, downloads, and sign-out. Then create platform production binaries on the `production` channel and submit them through Google Play and App Store Connect.
