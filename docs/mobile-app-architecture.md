# Vylanous Beats Native Mobile App Architecture

## Product decision

Vylanous Beats will ship as a **purpose-built Expo/React Native companion app** for Android and iPhone. It will use the public Vylanous API and the same catalog, beat metadata, licensing rules, artwork, audio previews, and fulfillment system as `https://www.vylanous.com`, while providing mobile-first navigation, native audio playback, haptics, safe-area handling, offline/error states, deep links, and store-native checkout.

The app is deliberately **not** a remote WebView wrapper. Website-only layout or interaction changes are not silently mirrored in the native app. Content and business data update from the live API; mobile UI changes are deployed with Expo over-the-air updates when they do not alter the native runtime.

## Application architecture

| Layer            | Responsibility                                                            | Implementation                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile client    | Native customer experience                                                | Expo SDK 54, Expo Router, React Native, safe-area support, native tabs, haptics, audio playback, sharing, deep linking, and persistent local cart.                      |
| Live catalog API | Beats, tiers, artwork, preview URLs, availability, and licensing copy     | Existing Vylanous web/API deployment at `https://www.vylanous.com/api`. New mobile endpoints will be explicitly versioned and CORS-safe.                                |
| Commerce client  | Product discovery and purchase UI                                         | `expo-iap` in custom development/production builds. Product IDs are queried from Apple/Google storefronts for localized price display.                                  |
| Commerce backend | Verification, idempotent fulfillment, email delivery, refunds/revocations | Hono routes, Drizzle persistence, App Store Server API, Google Play Developer API, and the existing Vylanous delivery-email pipeline.                                   |
| Update delivery  | JavaScript and asset updates that do not require native code              | Expo Application Services Update production channel. Updates publish only after a successful mobile validation workflow and remain within the selected free-plan quota. |
| Native releases  | New permissions, libraries, store metadata, or platform configuration     | EAS cloud builds, Firebase App Distribution beta testing, then App Store Connect and Play Console submission.                                                           |

## User experience

The first release contains a dark, brand-aligned mobile application with Home, Beat Catalog, Beat Detail, License Selection, Cart, Purchase, and Library/Orders experiences. Customers can stream previews, filter/search the catalog, choose a license tier, make a store-native purchase, and receive the license/download delivery email. The app uses native loading, retry, error, empty, and offline states; Android back navigation; native sharing; and universal/app links for beat pages.

## In-app commerce model

The website currently sells a selected beat plus a tiered digital license. Apple and Google require store billing for digital goods purchased inside their apps. Store products cannot be created dynamically as beats are added, so the mobile store catalog uses fixed **license-credit one-time products**:

| Store product            | Internal product ID                   | Redeemable entitlement                                              |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------- |
| MP3 Lease Credit         | `com.vylanousbeats.license.mp3`       | One MP3 lease for a selected beat.                                  |
| WAV Lease Credit         | `com.vylanousbeats.license.wav`       | One WAV lease for a selected beat.                                  |
| Unlimited Lease Credit   | `com.vylanousbeats.license.unlimited` | One unlimited license for a selected beat.                          |
| Exclusive License Credit | `com.vylanousbeats.license.exclusive` | One exclusive license for a selected beat, subject to availability. |

Free licenses continue through the Vylanous backend without a store purchase. Each paid mobile purchase must include the selected beat and buyer delivery email. The backend verifies the store transaction before creating a paid order, writes an immutable platform transaction record, locks/rechecks exclusive inventory, sends delivery email, and returns the fulfilled order. A transaction ID is unique across fulfillment attempts to prevent duplicate delivery.

This model keeps storefront products stable even as the beat catalog changes. Before launch, the four products must be created with matching descriptions, pricing, and tax classification in both App Store Connect and Play Console.

## Required backend additions

| Item                                            | Purpose                                                                                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mobile_purchase_transactions` table            | Idempotency key, platform transaction ID/token, product ID, selected beat, customer email, verification status, store environment, order ID, timestamps, and revocation/refund state.        |
| `POST /api/mobile/purchases/verify-and-fulfill` | Validates product/beat/tier consistency, verifies the purchase server-side, writes transaction and order in one controlled flow, and sends delivery email only after confirmed verification. |
| Store-verification adapters                     | Apple App Store Server API transaction verification and Google Play Developer API purchase-token verification. Their credentials are environment-only and never shipped in the app.          |
| Notification/webhook routes                     | Apple App Store Server Notifications and Google Real-time Developer Notifications update revocation/refund status and affected entitlements.                                                 |
| Mobile catalog endpoint or response contract    | Returns only the fields mobile screens need, with absolute, HTTPS-only artwork and preview URLs.                                                                                             |
| CORS policy                                     | Allows only the configured mobile runtime origins as necessary; public catalog routes remain read-only.                                                                                      |

## Configuration and secrets

The native app uses the stable identifiers `com.vylanousbeats.app` and the URL scheme `vylanousbeats`. Production identifiers should not be changed after store products are created.

The mobile client contains no billing credentials. Production configuration requires an Expo project ID and update URL, Apple issuer/key/key-ID/bundle-ID credentials for server verification, Google Play service-account credentials for server verification, Apple/Google notification authentication, and an EAS token for CI. These values are supplied through protected deployment/CI secret stores only.

## Update and release workflow

1. Validate the web/API and mobile app independently.
2. Publish a JavaScript/asset update to the Expo `production` channel when only mobile JavaScript/assets change.
3. Produce a new Android/iOS binary when native runtime, permissions, native library versions, store billing, or app configuration changes.
4. Upload beta binaries to Firebase App Distribution and TestFlight/Play testing tracks.
5. Submit signed release builds from App Store Connect and Play Console once real purchase and fulfillment tests pass.

The Expo free plan can serve initial development and limited production usage, but it is quota-bound. The automation must fail safely rather than publish an untested update.

## Store-review safeguards

The application includes app-specific native behavior rather than a generic browser wrapper. It provides meaningful catalog discovery, native playback, purchase flows, in-app order fulfillment, deep links, offline/error states, and mobile navigation. Digital product purchases use store billing. The final privacy labels, data-safety declaration, age rating, support URL, privacy-policy URL, app screenshots, product metadata, test account/steps, and reviewer notes must be completed before submission.

## References

1. [Expo in-app purchases guide](https://docs.expo.dev/guides/in-app-purchases/)
2. [Expo Application Services pricing](https://expo.dev/pricing)
3. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
4. [Google Play one-time purchase lifecycle](https://developer.android.com/google/play/billing/lifecycle/one-time)
5. [Apple App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
