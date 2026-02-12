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

## Expo Go login-link support

Expo Go cannot register the production custom URL scheme the same way as a standalone app.

The OTP screen includes **Use link from clipboard**:

1. Copy the login link from email.
2. In the app OTP screen, tap **Use link from clipboard**.
3. The app extracts `accessToken` and logs in.

You can still paste/type the code manually in the OTP field as usual.
