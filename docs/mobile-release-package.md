# Vylanous Beats Mobile Release Package

## Store identity

| Field                    | Value                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| App name                 | Vylanous Beats                                                                                          |
| iOS bundle identifier    | `com.vylanousbeats.app`                                                                                 |
| Android application ID   | `com.vylanousbeats.app`                                                                                 |
| URL scheme               | `vylanousbeats://`                                                                                      |
| Support email            | `support@vylanous.com`                                                                                  |
| Website                  | `https://www.vylanous.com`                                                                              |
| Primary category         | Music                                                                                                   |
| Secondary category       | Entertainment                                                                                           |
| Content rating direction | Music, user-generated content: no; mature visual brand themes: disclose accurately during questionnaire |

## Store listing copy

**Subtitle / short description**

> Premium hip-hop beats, mobile previews, and instant licensing.

**Full description**

> Vylanous Beats is the native destination for premium hip-hop production built for independent artists. Browse a live catalog of beats, stream previews, filter by sound and mood, choose the license that matches your release, and purchase securely in the app. Every confirmed order is verified with Apple or Google before license files are delivered to your email.
>
> Explore featured drops, keep selected licenses in your cart, share beats with collaborators, and move from inspiration to release with a focused mobile experience. New catalog content is delivered from Vylanous Beats as it is released.

**Keywords**

> hip hop beats, rap instrumentals, beat licensing, music producer, trap beats, recording artist, songwriting

## Required in-app products

Create the following **consumable one-time products** in both App Store Connect and Play Console. The identifiers must match exactly.

| Product ID                            | Display name             | Initial reference price | Fulfillment                                      |
| ------------------------------------- | ------------------------ | ----------------------: | ------------------------------------------------ |
| `com.vylanousbeats.license.mp3`       | MP3 Lease Credit         |                   CA$24 | Redeem for one selected MP3 beat lease.          |
| `com.vylanousbeats.license.wav`       | WAV Lease Credit         |                   CA$49 | Redeem for one selected WAV beat lease.          |
| `com.vylanousbeats.license.unlimited` | Unlimited Lease Credit   |                   CA$99 | Redeem for one selected unlimited beat license.  |
| `com.vylanousbeats.license.exclusive` | Exclusive License Credit |                  CA$299 | Redeem for one available exclusive beat license. |

The product descriptions must state that each purchase grants one license credit for a selected Vylanous beat. Do not create beat-specific products; the catalog changes independently from the four stable license products.

## Required protected configuration

| Destination    | Required value                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo/EAS       | Expo account, EAS project ID, `EXPO_TOKEN` repository secret. Replace `REPLACE_WITH_EAS_PROJECT_ID` after `eas init`.                         |
| Apple backend  | `APPLE_IAP_PRIVATE_KEY`, `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_BUNDLE_ID`, plus App Store Server Notifications configuration. |
| Google backend | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `GOOGLE_PLAY_PACKAGE_NAME`, plus Real-time Developer Notifications configuration.                         |
| Store consoles | App records, the four products, pricing/tax settings, privacy/data-safety forms, test users, screenshots, and reviewer notes.                 |

No credentials belong in Git, the mobile app configuration, or browser-visible client code.

## Release sequence

1. Create the Expo project and replace the placeholder EAS project ID.
2. Add the required protected variables to the production backend and `EXPO_TOKEN` to repository secrets.
3. Create the four matching products in App Store Connect and Google Play Console.
4. Deploy the backend changes before testing purchase flows.
5. Build `preview` Android and iOS binaries, add sandbox/test purchasers, and test every license tier, duplicate transaction, cancellation, exclusive-beat race, refund, and email delivery.
6. Run beta distribution through Firebase App Distribution, TestFlight, and Play testing tracks.
7. Create signed `production` builds and submit in App Store Connect and Play Console.

## Validation record

| Check                                | Result                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Mobile TypeScript check              | Passed                                                                                                               |
| Web/API production build             | Passed                                                                                                               |
| Android Expo production-style export | Passed                                                                                                               |
| App identity and plugins             | Validated by Expo configuration inspection                                                                           |
| Store transaction verification       | Implemented but cannot be exercised until store products, service credentials, and sandbox purchasers are configured |

## Known account-bound steps

Final binary generation, over-the-air update publishing, sandbox transaction verification, and public store submission require the owner’s Expo account, Apple Developer membership, Google Play developer account, and protected store credentials. They cannot be completed safely without those accounts and values.
