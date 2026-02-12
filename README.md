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

## Expo Go login-link support

Expo Go cannot register the production custom URL scheme the same way as a standalone app.

The OTP screen includes **Use link from clipboard**:

1. Copy the login link from email.
2. In the app OTP screen, tap **Use link from clipboard**.
3. The app extracts `accessToken` and logs in.

You can still paste/type the code manually in the OTP field as usual.
