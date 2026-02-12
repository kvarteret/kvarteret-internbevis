# Head branch code review (React Native best practices)

Date: 2026-02-12
Scope: current `HEAD` state of `src/screens/HomeScreen.tsx`, `src/screens/KvarteretSkjermScreen.tsx`, `src/components/home/MenuSheet.tsx`, and `src/components/home/SemesterBox.tsx`.

## Summary

The codebase is generally solid: components are small, naming is clear, and side effects are handled with React hooks in predictable places. The most important improvements are about reducing avoidable re-renders, making accessibility strings localizable, and avoiding hard-coded presentation values that are hard to scale.

## What is working well

1. **Good use of early returns** in `HomeScreen` for loading and unauthenticated states.
2. **Defensive async control** in `KvarteretSkjermScreen` with abort handling and polling lifecycle cleanup.
3. **Readable action model** in `MenuSheet` where each row is data-driven.
4. **Simple presentational logic** in `SemesterBox` with focused helpers.

## Findings and recommendations

### 1) HomeScreen: non-localized accessibility label

- **Location:** `src/screens/HomeScreen.tsx`
- **Issue:** `accessibilityLabel="Open menu"` is hard-coded in English.
- **Why it matters:** Accessibility text should follow app language, same as visible copy.
- **Recommendation:** Add a translation key, e.g. `openMenu`, and use `t('openMenu')`.

### 2) HomeScreen/MenuSheet: unstable callback props can trigger avoidable child re-renders

- **Location:** `src/screens/HomeScreen.tsx`
- **Issue:** Several props are passed as inline lambdas (`onOpenGames`, `onOpenPrivacy`, etc.).
- **Why it matters:** If child components are memoized (or later become memoized), unstable callback identity can reduce memoization effectiveness.
- **Recommendation:** Use `useCallback` for frequently passed handlers where practical. Keep only the callbacks that are passed down, not every local handler.

### 3) SemesterBox: hard-coded display text in Norwegian

- **Location:** `src/components/home/SemesterBox.tsx`
- **Issue:** `Trinn ${tier}` is hard-coded Norwegian text.
- **Why it matters:** It bypasses localization and creates mixed-language UI.
- **Recommendation:** Introduce translation key with interpolation, e.g. `tierLabel: 'Trinn {{tier}}'` / `'Tier {{tier}}'`.

### 4) SemesterBox: custom tier-to-color mapping via literals is hard to maintain

- **Location:** `src/components/home/SemesterBox.tsx`
- **Issue:** Repeated hex strings in `getTierBackgroundClass` make theme updates harder and invite divergence.
- **Why it matters:** Visual semantics are domain values and should be centralized.
- **Recommendation:** Move tier-color mapping to a named constant (preferably in theme/constants), and keep one default fallback.

### 5) KvarteretSkjermScreen: loading state can remain stale after non-loader refresh failures

- **Location:** `src/screens/KvarteretSkjermScreen.tsx`
- **Issue:** `setIsLoading(false)` only runs when `showLoader` is true. If first load succeeds and polling later fails, state rendering is still okay because `error` is set, but the loading state logic is split by call mode.
- **Why it matters:** Split state transitions by mode increase cognitive load and can produce edge-case inconsistencies over time.
- **Recommendation:** Consider explicit request state model (`idle | loading | refreshing | error | success`) or keep `isLoading` for first load only with clearer naming (`isInitialLoading`).

### 6) KvarteretSkjermScreen: render conditions are clear, but can be made more human-readable

- **Location:** `src/screens/KvarteretSkjermScreen.tsx`
- **Issue:** `showUnauthorized`, `showIdle`, `showPlaying` repeat common condition fragments.
- **Why it matters:** Repeated boolean clauses are easy to drift when logic evolves.
- **Recommendation:** Extract base flags (`hasData`, `hasError`, `isAuthorized`, `isCurrentlyPlaying`) and compose from those.

### 7) MenuSheet: dynamic className string composition is serviceable but noisy

- **Location:** `src/components/home/MenuSheet.tsx`
- **Issue:** Array + filter + join for classes on each item is harder to parse at a glance.
- **Why it matters:** Minor readability tax in a high-scan UI file.
- **Recommendation:** Introduce and consistently use a `cn()` utility for class composition instead of repeated `array + filter + join` snippets.

### 8) KvarteretSkjermScreen: consider TanStack Query for server-state lifecycle

- **Location:** `src/screens/KvarteretSkjermScreen.tsx` and `src/services/kvarteretSkjermService.ts`
- **Issue:** Polling, cancellation, loading/error states, and refetch logic are manually orchestrated.
- **Why it matters:** Manual server-state orchestration adds mental overhead and can become brittle as features (retry policies, stale time, background refetch behavior) grow.
- **Recommendation:** Consider TanStack Query (or equivalent) for declarative server-state handling (`queryKey`, `queryFn`, `refetchInterval`, `enabled`, built-in retries/caching). Keep component code focused on rendering states rather than request plumbing.

## Suggested priority

- **High:** #1, #3 (a11y and localization correctness)
- **Medium:** #2, #4, #7 (maintainability and consistency)
- **Low:** #5, #6, #8 (readability refinements / architecture option)

## Human-brain maintainability check

Relative to the stated standards (few active chunks, readable conditionals, meaningful names), the code is close to target. Biggest gains will come from:

1. Turning implicit UI rules into named constants/flags.
2. Keeping all user-facing text in localization.
3. Reducing small repeated logical fragments in render conditions.
