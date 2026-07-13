# Feature-First Architecture

## Why this architecture

This repo is optimized for:

- a small team (about 3-5 engineers),
- mostly junior contributors with one senior reviewer,
- fast iteration without losing structure,
- clear patterns that teach good engineering habits.

We use **Feature-first** as the base. Screen logic is **composed hooks**, not
a ViewModel layer — see rule 2.

## Source of truth folders

- `src/app`: app bootstrap, providers, navigation, config
- `src/features/<feature>`: vertical product slices — `data/` (network,
  storage read/write for this feature), `domain/` (pure business logic and
  types — no React, no I/O), `ui/` (screens and components), `vm/` (composed
  hooks; see rule 2)
- `src/shared`: cross-cutting code every feature is allowed to depend on —
  reusable UI (`shared/ui`), pure domain rules used by more than one feature
  (`shared/domain`), pure utilities (`shared/utils`, `shared/time`), shared
  types (`shared/types`)
- `src/core`: platform infrastructure with no product knowledge — HTTP/Sanity
  clients, storage primitives (`getStoredJson`/`setStoredJson`, SecureStore
  wrappers), deep-link parsing plumbing

If code has business meaning specific to one feature (an HTTP client for that
feature's API, a domain rule only that feature uses), it belongs in that
feature's `data/`/`domain/`, not in `core/` or `shared/`. If two or more
features need the same domain rule, promote it to `shared/domain` (not
`core/`) — `core/` is for code with no product/domain knowledge at all. When
in doubt: "would this make sense in a project with a completely different
domain?" — yes → `core/`; no but more than one feature needs it → `shared/`;
no and only one feature needs it → that feature.

## Rules

### 1) Feature boundaries — enforced mechanically

- A feature must not import another feature directly.
- If reuse is needed, move shared code into `src/shared` or `src/core`.
- These rules are not just reviewer vigilance: `.dependency-cruiser.cjs` runs
  `npm run lint:architecture` in CI and fails the build on a violation. It
  encodes four rules: no feature→feature imports, domain modules import
  nothing from `ui/`/`data/`/`react-native`, `shared/` imports nothing from
  `features/`/`app/`, and `routes/` imports only feature `ui/`/`vm/` and
  `app/`. Known, deliberate exceptions are listed with a reason directly in
  `.dependency-cruiser.cjs` — do not add a new one without writing the reason
  there and in the active ExecPlan's Decision Log.

### 2) Screen complexity policy — composed hooks, not a ViewModel layer

Use the **simple screen pattern** when screen logic is trivial: one query or
no query, limited branching, local UI state only, no complex side effects.

When a screen is non-trivial (multiple async states and retries, mixed
server state + UI state, deep-link/AppState/subscription side effects,
multi-step flows), **compose several focused hooks** — do not reach for one
ViewModel hook that owns the whole screen. Each hook owns one concern and
returns **no more than ~8 members**; if a hook grows past that, split it.

```
useOtpRequest(email)      // → { requestCode, isSending, requestError, clearRequestError }
useTokenLogin()           // → { performTokenLogin, loginError, clearLoginError }
useDeepLinkLogin(mode, onToken) // → void (side-effect-only hook)
```

The screen itself owns trivial local state (form fields, a toggle) directly
with `useState` — it doesn't need a hook for that.

Why: a single hook returning 20+ fields (mode, multiple error strings, flags,
a dozen callbacks) is a Flutter `ChangeNotifier` wearing a hook costume —
every consumer re-renders on any field change because the returned object is
rebuilt each render, the hook can't be tested or reused in parts, and "is
this screen complex enough for a VM?" is exactly the judgment call juniors
get wrong in both directions. Composed hooks avoid all three problems: each
is independently testable, each has its own re-render surface, and there's
no threshold decision — you're always just extracting the next concern.

The `vm/` folder name stays (it signals "screen-logic hooks live here"), but
it holds composed hooks, not a single VM object.

### 3) State modeling

- Model mutually exclusive states as **one discriminated union**
  (`status: "hydrating" | "authenticated" | "anonymous" | "signedOut"` with a
  payload per branch), never as parallel booleans. Parallel booleans
  (`isLoading`, `isAnonymous`, `hasStoredCredentials`, `error`, …) admit
  impossible combinations (e.g. `isHydrating && user`) that then have to be
  guarded against at every call site instead of being unrepresentable.
- Server state lives in TanStack Query and is never mirrored into a
  provider's own `useState`.
- Provider/context values must be referentially stable: every function
  placed in a context value goes through `useCallback`, and the value object
  itself through `useMemo` with a complete dependency list. Otherwise the
  `useMemo` does nothing — the functions are new every render, so every
  consumer re-renders whenever the provider does, regardless of whether the
  data they actually use changed.
- Complex *decision logic* embedded in a provider's `useEffect` (e.g. "given
  stored credentials, a cache, and a login marker, what should happen on
  launch") should be a pure function in that feature's `domain/`, called from
  the effect — not written inline. Pure functions are unit-testable without
  mounting a provider; see `features/auth/domain/sessionHydration.ts` for the
  shape (`resolveHydrationPrecheck`/`resolveHydrationErrorOutcome`) and its
  test file for the branch-coverage this buys.

### 4) Data ownership

- Server access lives in `features/<feature>/data` or `core/api`.
- Views do not call `fetch` directly for business features.
- TanStack Query is the default server-state layer.
- Every network payload crosses exactly one Zod parse at the repository
  layer (`features/<feature>/data`). Components and domain code never see
  `unknown` or reach for an `as T` cast on external data. If you touch a file
  with a hand-rolled parser, replace it with a schema rather than adding
  another one next to it.

### 5) UI ownership

- Shared reusable primitives go in `src/shared/ui`.
- Feature-specific components stay in `features/<feature>/ui/components`.
- A screen file that grows past roughly 400 lines should have its inline
  sub-components extracted into `ui/components/*.tsx` files, keeping props
  as-is — extraction is a pure move, not a redesign.

### 6) Styling

- **Everywhere (`src/shared`, `src/features`, `src/routes`) is Uniwind `className` first.**
- `style` is an escape hatch only for:
  - computed runtime values (measured dimensions, animation values, interpolation output)
  - native-only style APIs not expressible with utility classes
  - third-party component contracts requiring style objects
- **Design-system components must expose `className` as the primary styling API.**
- `global.css` is the only design-token source.
- Use `useThemeRuntimeColors` when a native prop needs a concrete runtime color value.
- Prefer inherited defaults from layout shells (`bg-background`, default text from shared `Text`) and only override colors for semantic exceptions.
- Prefer semantic token classes (`state-danger`, `state-success`, etc.) from `global.css`.
- Avoid introducing new hard-coded color values outside token source files.
- For stack/tab screens with native navigation chrome, prefer the first `ScrollView`/`FlatList` with `contentInsetAdjustmentBehavior="automatic"` over route-level `SafeAreaView` wrappers.
- Treat `SafeAreaView` as exception-only for hidden-header or non-scroll layouts.

### 7) Style exception annotation

When `style` is required, annotate the local constant/block with:

`// Style escape hatch: <reason>`

Examples:
- `// Style escape hatch: Animated interpolation output`
- `// Style escape hatch: third-party contentStyle prop`

### 8) Imports

- Prefer alias imports (`@/*`).
- Avoid deep relative imports (`../../..`) in production code.

## Minimal acceptance checklist

For a new screen or refactor:

1. Screen is placed under the correct feature.
2. Complexity level chosen (simple vs. composed hooks) with rationale; no
   hook returns more than ~8 members.
3. Any mutually-exclusive state is one discriminated union, not parallel
   booleans; any context value is referentially stable.
4. Data access is not embedded in presentational shared components; network
   responses are parsed through a schema at the repository layer.
5. No cross-feature imports were introduced (`npm run lint:architecture`
   passes).
6. Tests cover new business logic or state transitions.
7. No new `StyleSheet.create` usage unless explicitly approved as a style exception.

## CI enforcement

The rules above are backed by checks in `.github/workflows/code-quality.yml`,
not just this document:

- `npx biome ci .` — formatting and lint rules.
- `npx tsc --noEmit` — type errors.
- `npx jest --ci` — test suite.
- `npm run check:style-exceptions` — no un-annotated `StyleSheet.create`.
- `npm run lint:architecture` — the four boundary rules from rule 1, via
  `dependency-cruiser` (config: `.dependency-cruiser.cjs`).

A PR that violates any of these turns the `code-quality` check red.
