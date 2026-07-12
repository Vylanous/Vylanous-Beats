# Quick Start: Build & Download APK

Follow these steps to run your app in the browser and build an APK for Android.

## Step 1: Run Web App Locally

```bash
cd packages/web
bun install
bun run dev
```

Open http://localhost:5173 in your browser. Your app is now running!

## Step 2: Build for Production

```bash
cd packages/web
bun run build
```

This creates an optimized `dist/` folder that will be packaged into the APK.

## Step 3: Add Android (One-time setup)

```bash
cd packages/web
bunx cap add android
```

This creates an `android/` directory with the native Android project.

## Step 4: Sync Web App to Android Project

```bash
bunx cap sync
```

Copies your built web app and updates dependencies.

## Step 5: Open Android Studio

```bash
bunx cap open android
```

This opens Android Studio with your project ready.

## Step 6: Build APK in Android Studio

### Option A: Debug APK (Quick, for testing)
1. In Android Studio, go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete (2-5 minutes)
3. A notification appears → Click "Locate" to find the APK
4. APK saves to: `android/app/debug/app-debug.apk`

### Option B: Release APK (for distribution)
1. **Build → Generate Signed Bundle/APK**
2. Choose **APK** (not Bundle)
3. Create a new keystore:
   - Click "Create new"
   - Set password (remember this!)
   - Click "OK"
4. Fill in alias and password
5. Select **Release** build type
6. Click **Finish**
7. APK saves to: `android/app/release/app-release.apk`

## Step 7: Transfer APK to Phone

### Via USB Cable
1. Connect Android phone via USB
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging (toggle on)
3. In Android Studio:
   - Select your device from dropdown
   - Press Play (⌘R or Shift+F10)
4. App installs and launches on your phone!

### Via Email/Cloud
1. Build APK (steps above)
2. Find the APK file on your computer
3. Email it to yourself or upload to Google Drive
4. On your phone, open the email/Drive, download APK
5. Open file manager, tap the APK to install
6. May need to enable "Unknown sources":
   - Settings → Security → Unknown sources (toggle on)

### Via ADB Command Line
```bash
# Install debug APK
adb install android/app/debug/app-debug.apk

# Or release APK
adb install android/app/release/app-release.apk
```

## Verify Installation

1. Phone home screen should show "Vylanous Beats" app icon
2. Tap to open
3. You should see your beats, cart, everything working!

## Troubleshooting

**"Android Studio not found"**
- Download from: https://developer.android.com/studio
- Or set `ANDROID_HOME` environment variable to installation path

**APK build fails**
- Check Java version: `java -version` (should be 11+)
- Run `bun run capacitor:sync` again
- Check Android Studio's Build panel for error details

**App won't install on phone**
- Uninstall old version: Settings → Apps → Vylanous Beats → Uninstall
- Make sure APK matches phone architecture (most phones are arm64)
- Try debug APK first (debug-apk is easier to install)

**App crashes on launch**
- Check Android Studio Logcat for errors
- Run `adb logcat | grep vylanous` to see logs
- Ensure backend API is reachable from phone (same WiFi as desktop)

## Update Workflow

After making changes to your beats, cart, or admin panel:

```bash
# 1. Build updated web app
cd packages/web
bun run build

# 2. Sync to Android
bunx cap sync

# 3. Rebuild APK in Android Studio
# Or via command line:
cd android
./gradlew assembleDebug  # for debug APK
./gradlew assembleRelease  # for release APK
```

APK is ready to install on phone!

## Next: Distribution

When ready to share with users:
1. Upload Release APK to **Google Play Store**
2. Or host on your website for direct download
3. Or use **Firebase App Distribution** for beta testing

See `README-CAPACITOR.md` for full app store submission guide.
