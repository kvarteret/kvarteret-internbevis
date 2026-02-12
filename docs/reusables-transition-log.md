# Reusables Transition Log

## RNR-001
- Decision ID: `RNR-001`
- Status: `Accepted`
- Context: We evaluated overlay migration to reusables `Dialog` for language and menu overlays.
- Decision: Keep native `Modal` for overlays and remove reusables `Dialog` abstraction.
- Tradeoffs:
  - Pros: native back/backdrop behavior with less infra and fewer dependencies.
  - Cons: overlays are not unified under a reusables primitive.
- Replacement List:
  - Native: `Modal`
    Reusables: none (kept native)
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/LanguageSelectorModal.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/MenuSheet.tsx`
    Behavior notes: preserved close on Android back and backdrop press.
  - Native: n/a
    Reusables: removed `Dialog` (`@rn-primitives/dialog`)
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/ui/dialog.tsx`
    Behavior notes: removed portal-backed dialog layer from app.
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - manual overlay open/close behavior verified through existing props flow.

## RNR-002
- Decision ID: `RNR-002`
- Status: `Accepted`
- Context: Auth and actions used custom wrappers and native controls (`TextInput`, `TouchableOpacity`) that duplicated design-system behavior.
- Decision: Remove wrapper abstraction and use reusables controls directly.
- Tradeoffs:
  - Pros: fewer custom abstractions, better consistency, easier future component reuse.
  - Cons: larger one-time diff and class updates.
- Replacement List:
  - Native: `TextInput`
    Reusables: `Input`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/LoginBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/VerifyCodeBox.tsx`
    Behavior notes: kept current value/onChange validation and error messaging logic.
  - Native: `TouchableOpacity` (button-like actions)
    Reusables: `Button`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/LoginScreen.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/HomeScreen.tsx`
    Behavior notes: kept same click targets and callbacks, moved styling to button variants/classes.
  - Native: wrapper components `AppButton`, `AppTextField`
    Reusables: direct `Button`, `Input`, `Text`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/LoginBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/VerifyCodeBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/NotRegisteredScreen.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/KvarteretSkjermScreen.tsx`
    Behavior notes: wrapper APIs removed; call sites now import from `@/components/ui/*`.
- Validation:
  - `npx tsc --noEmit`
  - `npm test -- --runInBand`

## RNR-003
- Decision ID: `RNR-003`
- Status: `Accepted`
- Context: Most UI text used native `Text` directly, fragmenting typography semantics.
- Decision: Standardize app-facing typography on reusables `Text`.
- Tradeoffs:
  - Pros: consistent token usage and typography variants.
  - Cons: broad import/class migration.
- Replacement List:
  - Native: `Text`
    Reusables: `Text`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/LanguageSelectorModal.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/BottomContainer.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/MenuSheet.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/SemesterBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/UserInfoCard.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/LoginBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/VerifyCodeBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/GamesScreen.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/HomeScreen.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/KvarteretSkjermScreen.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/NotRegisteredScreen.tsx`
    Behavior notes: semantics and copy unchanged; class tokens migrated to canonical reusables tokens.
- Validation:
  - `npm run lint`
  - manual copy/label rendering checks during screen-level migration.

## RNR-004
- Decision ID: `RNR-004`
- Status: `Accepted`
- Context: Multiple card-like `View` containers used duplicated border/background/radius patterns.
- Decision: Replace card-like view blocks with reusables `Card` where semantics were clear.
- Tradeoffs:
  - Pros: more consistent structure and spacing, reduced repeated utility class strings.
  - Cons: slight default spacing/appearance shifts from prior custom styling.
- Replacement List:
  - Native: card-like `View` containers
    Reusables: `Card`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/LoginBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/VerifyCodeBox.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/UserInfoCard.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/GamesScreen.tsx`, `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/KvarteretSkjermScreen.tsx`
    Behavior notes: preserved content grouping and actions while adopting reusables card defaults.
- Validation:
  - `npx biome ci .`
  - `npx tsc --noEmit`

## RNR-005
- Decision ID: `RNR-005`
- Status: `Accepted`
- Context: Selection/progress UI used hand-rolled controls.
- Decision: Migrate selection and progress visuals to dedicated reusables primitives.
- Tradeoffs:
  - Pros: accessible control primitives and standardized interaction model.
  - Cons: slight visual changes from custom previous elements.
- Replacement List:
  - Native: custom checkbox touch target (`TouchableOpacity` + styled `View` + checkmark text)
    Reusables: `Checkbox`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/login/LoginBox.tsx`
    Behavior notes: maintained consent gating logic before OTP request.
  - Native: custom option selection row state
    Reusables: `RadioGroup`, `RadioGroupItem`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/LanguageSelectorModal.tsx`
    Behavior notes: maintained language switch + modal close behavior.
  - Native: custom progress bar (`View` track + `View` fill)
    Reusables: `Progress`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/screens/KvarteretSkjermScreen.tsx`
    Behavior notes: preserved clamped percentage behavior.
  - Native: custom avatar shell (`View` fallback structure)
    Reusables: `Avatar`, `AvatarImage`, `AvatarFallback`
    Files: `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/home/UserAvatar.tsx`
    Behavior notes: preserved animation and local/remote image fallback behavior.
- Validation:
  - `npm test -- --runInBand`
  - manual state-path checks for checkbox/radio/progress/avatar fallback.

## Cleanup Decisions
- Deleted legacy wrappers:
  - `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/common/AppButton.tsx`
  - `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/components/common/AppTextField.tsx`
- Deleted legacy theme surface:
  - `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/src/constants/theme.ts`
- Canonical token direction:
  - removed legacy semantic aliases from `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/tailwind.config.js` and `/Users/kluvin/dev/kvarteret/kvarteret-internbevis-rn/global.css`.

## Final Validation Snapshot
- `npm run lint` passed.
- `npx biome ci .` passed.
- `npx tsc --noEmit` passed.
- `npm test -- --runInBand` passed.
- `npx @react-native-reusables/cli@latest doctor -c . --summary` reports known non-blocking setup warnings for this non-Expo-Router app structure.
