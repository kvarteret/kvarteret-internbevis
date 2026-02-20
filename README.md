# Kvarteret Internbevis (Expo)

React Native reimplementation of `kvarteret_internbevis` using Expo.

## Run in Expo Go

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm run start
```

3. Open the project in Expo Go by scanning the QR code.

## Development builds (installable dev clients)

Expo Go is useful for fast iteration, but development builds are required when
you need native modules/config that Expo Go does not include and when you want
to share installable test builds with teammates.

This repo now includes dedicated EAS build profiles:
- `development-android`
- `development-ios` (physical iPhone/iPad, Ad Hoc)
- `development-ios-simulator`

### Build commands

```bash
npx eas build --platform android --profile development-android
npx eas build --platform ios --profile development-ios
npx eas build --platform ios --profile development-ios-simulator
```

Or use npm scripts:

```bash
npm run build:dev:android
npm run build:dev:ios
npm run build:dev:ios-simulator
```

### Run locally in a development build

After installing the dev client build on your device/simulator:

```bash
npx expo start --dev-client
# or
npm run start:dev-client
```

### Sharing strategy by platform

1. Android: share the EAS install link from the build details page.
2. iOS device: testers must be on the Ad Hoc provisioning profile (UDID
   registered via Apple Developer/EAS).
3. iOS simulator: teammates can install with `npx eas build:run --platform ios --profile development-ios-simulator`.
4. Web: development builds do not apply to web. Keep using PR previews/deploy previews for browser testing.

### Optional: run all dev builds via EAS Workflow

```bash
npx eas workflow:run .eas/workflows/create-development-builds.yml --wait
# or
npm run workflow:dev-builds
```

## Class name utility (`cn`)

Use `cn` to compose `className` values with conditionals and automatically
resolve conflicting Tailwind utilities (last one wins).

```tsx
import { Pressable } from 'react-native';
import { cn } from './src/utils/cn';

<Pressable
  className={cn(
    'rounded-xl px-4 py-3 bg-green-600',
    isDisabled && 'opacity-50',
    isPrimary ? 'bg-green-600' : 'bg-slate-600',
  )}
/>;
```

## Preview deployments (EAS + Firebase App Distribution)

This repository is configured for hybrid previews:
1. PR-level JS previews with EAS Update (`.github/workflows/preview-update.yml`).
2. On-demand installable preview binaries with EAS Build + Firebase App Distribution (`.github/workflows/preview-build-distribute.yml`).

### One-time setup required

1. Create or select the dedicated Firebase preview project.
2. Register Android app id `com.kvarteret.internbevis.internbevisrn` in Firebase App Distribution.
3. Register iOS app id `com.kvarteret.internbevis.internbevisrn` in Firebase App Distribution.
4. Create Firebase tester group `internal-qa`.
5. Link the Expo project to EAS and get the project id UUID.
6. Verify `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/app.json` contains:
   - `extra.eas.projectId = 8e46104c-a94c-4205-9884-4f813b6371c3`
   - `updates.url = https://u.expo.dev/8e46104c-a94c-4205-9884-4f813b6371c3`

### Required GitHub secrets

1. `EXPO_TOKEN`
2. `FIREBASE_SERVICE_ACCOUNT_PREVIEW` (full JSON key content)
3. `FIREBASE_ANDROID_APP_ID_PREVIEW`
4. `FIREBASE_IOS_APP_ID_PREVIEW`
5. `FIREBASE_DISTRIBUTION_GROUPS_PREVIEW` (optional, defaults to `internal-qa`)
6. `EXPO_PROJECT_ID` (for operational reference in CI and setup)

### How preview workflows trigger

1. `preview-update.yml` runs on PR open/update/reopen and publishes EAS updates to branch `pr-<PR_NUMBER>`.
2. `preview-build-distribute.yml` runs only when the PR has label `preview`.
3. Add label `preview` to request Android/iOS preview binaries.
4. Remove label `preview` to stop triggering binary preview builds on new commits.

### iOS Ad Hoc onboarding

1. Collect tester UDIDs.
2. Register devices through EAS/Apple Developer for the preview provisioning profile.
3. Re-run preview build after adding devices so new testers can install the iOS build from Firebase App Distribution.

## Production releases (manual dispatch CI)

This repository now uses a controlled release workflow:
- `.github/workflows/release-submit.yml` builds production binaries and submits to TestFlight internal + Play internal testing.
- `.github/workflows/release-promote-checklist.yml` creates the manual promotion checklist for App Store Connect and Google Play.

### Required release secrets

1. `EXPO_TOKEN`
2. `APP_STORE_CONNECT_ISSUER_ID`
3. `APP_STORE_CONNECT_KEY_ID`
4. `APP_STORE_CONNECT_API_KEY_P8`
5. `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
6. `TESTFLIGHT_INTERNAL_GROUPS` (optional, comma-separated)

### Release versioning

Release workflow version/build is date-driven:
1. App version: `YYYY.M.<build-sequence>`
2. iOS `buildNumber`: unix timestamp (seconds)
3. Android `versionCode`: unix timestamp (seconds)

### How to release

1. Push a release ref/tag.
2. Run `release-submit.yml` with:
   - `release_tag`
   - `platform` (`all|ios|android`)
   - `publish_update` (`true|false`)
   - `release_notes` (optional)
3. Validate in TestFlight internal + Play internal.
4. Run `release-promote-checklist.yml` and complete manual production promotion in store consoles.

## Local backend (infra + Personaldatabase)

For local development against the `infra` backend stack, the API root is:

- `http://localhost:5001/api`

The Internkort endpoints used by this app are under:

- `http://localhost:5001/api/DigitalInternkort`

When running Expo Go on a physical device, `localhost` points to the phone, not your computer.
Use your computer LAN IP instead.

Create `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/.env.local`:

```bash
EXPO_PUBLIC_INTERNKORT_BASE_URL=http://<LAN-IP>:5001/api/DigitalInternkort
# Optional (defaults to production if not set)
EXPO_PUBLIC_KVARTERET_SKJERM_BASE_URL=http://<LAN-IP>:<PORT>
```

Then start the app:

```bash
npm run start
```

## Expo Go login-link support

Expo Go cannot register the production custom URL scheme the same way as a standalone app.

The OTP screen includes **Use link from clipboard**:

1. Copy the login link from email.
2. In the app OTP screen, tap **Use link from clipboard**.
3. The app extracts `accessToken` and logs in.

You can still paste/type the code manually in the OTP field as usual.
