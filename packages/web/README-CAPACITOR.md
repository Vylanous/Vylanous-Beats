# Capacitor Mobile App Setup

This guide walks through setting up and deploying your Vylanous Beats website as a native mobile app using Capacitor.

## Prerequisites

- **iOS**: macOS with Xcode 15+, iOS 14+ target device
- **Android**: Android Studio with SDK 21+, Android device or emulator
- **Node.js**: 18+
- **Bun**: 1.3.14+

## Installation

### 1. Install Dependencies

```bash
cd packages/web
bun install
```

### 2. Build Web App

```bash
bun run build
```

This creates the optimized build in `dist/` that will be packaged into the native app.

### 3. Add Native Platforms

```bash
bun run capacitor:add
```

This creates `ios/` and `android/` directories with native project files.

### 4. Sync with Native Projects

```bash
bun run capacitor:sync
```

Sync copies your built web app and updates native dependencies.

## iOS Deployment

### Open Xcode

```bash
bun run capacitor:open:ios
```

### Configure in Xcode

1. **Bundle ID**: Change from `com.vylanousbeats.app` to your own (e.g., `com.yourname.vylanousbeats`)
2. **Team**: Select your Apple Developer account
3. **Signing Certificate**: Xcode handles this automatically
4. **Push Notifications**: Enable in Xcode → Signing & Capabilities → Push Notifications

### Build & Run

1. Select target device or simulator
2. Press Play (⌘R) or go to Product → Run
3. App appears on device/simulator

### Submit to App Store

1. Archive: Product → Archive
2. Upload to App Store Connect via Organizer
3. Fill out app metadata, screenshots, privacy policy
4. Submit for review

## Android Deployment

### Open Android Studio

```bash
bun run capacitor:open:android
```

### Configure in Android Studio

1. **Package Name**: Change from `com.vylanousbeats.app` to your own
2. **App Name**: Verify it shows "Vylanous Beats"
3. **targetSdkVersion**: Should be 35+ (set in `android/app/build.gradle`)

### Build & Run

1. Select device or emulator
2. Run → Run 'app' (Shift+F10)
3. App installs and launches automatically

### Generate Signed APK/AAB

1. Build → Generate Signed Bundle/APK
2. Create a new keystore or select existing
3. Fill in alias, password details
4. Choose "Android App Bundle" for Play Store
5. Select Release build type
6. APK/AAB saves to `android/app/release/`

### Submit to Play Store

1. Create app in Google Play Console
2. Upload AAB file
3. Fill out store listing, privacy policy, content rating
4. Submit for review

## Push Notifications Setup

### iOS (APNs)

1. Go to Apple Developer → Certificates, Identifiers & Profiles
2. Create a Push Notification Certificate for your App ID
3. Download `.p8` key file
4. In your backend, use this key to send push notifications via APNs

### Android (FCM)

1. Create Firebase project at firebase.google.com
2. Add iOS and Android apps to project
3. Download `google-services.json` for Android
4. Copy to `android/app/google-services.json`
5. Run `capacitor:sync` to update native build
6. In your backend, use Firebase Admin SDK to send notifications

## Backend Integration

Add these endpoints to your Hono API:

```typescript
// Register device for push notifications
.post('/api/push/register-device', async (c) => {
  const { token, platform } = await c.req.json();
  // Store token in database
  // Send confirmation
  return c.json({ ok: true });
})

// Send push notification to all users
.post('/api/admin/push-notify', requireAdmin, async (c) => {
  const { title, body, beatSlug } = await c.req.json();
  // Get all device tokens from database
  // Send via APNs (iOS) or FCM (Android)
  return c.json({ sent: true });
})
```

## App Icons

Replace these files in `public/`:

- `icon-192x192.png` — 192x192 PNG
- `icon-512x512.png` — 512x512 PNG
- `screenshot-540x720.png` — Mobile screenshot
- `screenshot-1280x720.png` — Tablet screenshot

Icons should have at least 48px padding from edges for "maskable" format (rounded corners on some devices).

## Testing Offline

The service worker caches:
- Core app shell (HTML, JS, CSS)
- API responses (24 hours)

Your app works offline for viewing cached beats, but checkout requires internet.

## Development Workflow

```bash
# Terminal 1: Watch web changes
cd packages/web
bun run dev

# Terminal 2: Sync to Capacitor (when you change code)
bun run capacitor:sync

# Terminal 3: Run native app
# iOS
bun run capacitor:open:ios
# Android  
bun run capacitor:open:android
```

Hot reload works on device — changes appear instantly.

## Troubleshooting

**App crashes on startup**
- Check `capacitor.config.ts` bundle ID matches native project
- Run `capacitor:sync` to copy latest web build
- Check console logs: `adb logcat` (Android) or Xcode Console (iOS)

**Push notifications not working**
- Verify permission granted: Settings → Vylanous Beats → Notifications
- Check device token registered in database
- Verify APNs/FCM credentials in backend

**Offline content not cached**
- Service worker only works on HTTPS (or localhost in dev)
- Hard refresh: Cmd+Shift+R (browser) or Force Stop app (mobile)
- Check browser DevTools → Application → Cache Storage

**App store submission rejected**
- Ensure privacy policy URL is correct
- Verify app doesn't access sensitive data without permission
- Test on multiple devices before submitting

## Next Steps

1. Create app store accounts (Apple Developer, Google Play)
2. Add push notification backend integration
3. Design app icons and screenshots
4. Test on real devices
5. Submit for review
6. Monitor analytics and user feedback
