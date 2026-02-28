# Feature-First + Selective MVVM

## Why this architecture

This repo is optimized for:

- a small team (about 3-5 engineers),
- mostly junior contributors with one senior reviewer,
- fast iteration without losing structure,
- clear patterns that teach good engineering habits.

We use **Feature-first** as the base, and **MVVM only where it pays off**.

## Source of truth folders

- `src/app`: app bootstrap, providers, navigation, config
- `src/features`: vertical product slices
- `src/shared`: reusable UI, shared utilities, shared types
- `src/core`: infrastructure and platform clients (api, storage, linking)

## Rules

### 1) Feature boundaries

- A feature must not import another feature directly.
- If reuse is needed, move shared code into `src/shared` or `src/core`.

### 2) Screen complexity policy

Use **simple screen pattern** when screen logic is trivial:

- one query or no query,
- limited branching,
- local UI state only,
- no complex side effects.

Use **MVVM pattern** when screen logic is non-trivial:

- multiple async states and retries,
- mixed server state + UI state,
- deep-link/AppState/subscription side effects,
- multi-step flows and non-trivial validation.

### 3) Data ownership

- Server access lives in `features/<feature>/data` or `core/api`.
- Views do not call `fetch` directly for business features.
- TanStack Query is the default server-state layer.

### 4) UI ownership

- Shared reusable primitives go in `src/shared/ui`.
- Feature-specific components stay in `features/<feature>/ui/components`.

### 5) Styling

- **Everywhere (`src/shared`, `src/features`, `src/routes`) is NativeWind `className` first.**
- `style` is an escape hatch only for:
  - computed runtime values (measured dimensions, animation values, interpolation output)
  - native-only style APIs not expressible with utility classes
  - third-party component contracts requiring style objects
- **Design-system components must expose `className` as the primary styling API.**
- Keep `themeColors` for runtime-driven style values; prefer semantic token classes for static styling.
- Prefer inherited defaults from layout shells (`bg-background`, default text from shared `Text`) and only override colors for semantic exceptions.
- Prefer semantic tokens (`state-danger`, `state-success`, etc.) from `src/shared/theme/tokens.json`.
- Avoid introducing new hard-coded color values outside token source files.

### 6) Style exception annotation

When `style` is required, annotate the local constant/block with:

`// Style escape hatch: <reason>`

Examples:
- `// Style escape hatch: Animated interpolation output`
- `// Style escape hatch: third-party contentStyle prop`

### 7) Imports

- Prefer alias imports (`@/*`).
- Avoid deep relative imports (`../../..`) in production code.

## Minimal acceptance checklist

For a new screen or refactor:

1. Screen is placed under the correct feature.
2. Complexity level chosen (simple vs VM) with rationale.
3. Data access is not embedded in presentational shared components.
4. No cross-feature imports were introduced.
5. Tests cover new business logic or state transitions.
6. No new `StyleSheet.create` usage unless explicitly approved as a style exception.

## 30-day transition target

1. New work uses source-of-truth folders only.
2. Team uses the `new-screen` skill as the default implementation workflow.
