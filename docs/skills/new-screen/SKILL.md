# Skill: new-screen

Create a new React Native screen using this repo's architecture:
**Feature-first + selective MVVM**.

This skill is both:

- a build checklist, and
- an implementation reference.

## When to use

Use this skill whenever adding a new screen or replacing an existing screen flow.

## Decision step: simple vs VM

Pick one before writing code.

Use **simple screen** if all are true:

1. Logic is straightforward.
2. No multi-step flow.
3. No complex side effects (deep links, AppState listeners, subscriptions).
4. One query or no query with simple error handling.

Use **VM screen** if any are true:

1. Non-trivial form or state transitions.
2. Multiple async sources and retries.
3. Derived state used by multiple UI sections.
4. Side effects beyond simple navigation.

## File placement

Feature location:

- `src/features/<feature>/ui/screens/<ScreenName>.tsx`

If VM is needed:

- `src/features/<feature>/vm/use<ScreenName>VM.ts`

If remote data is needed:

- `src/features/<feature>/data/<feature>Repository.ts`

If non-trivial rules are needed:

- `src/features/<feature>/domain/<rule>.ts`

Navigation and route params:

- `src/app/navigation/types.ts`
- `src/app/navigation/RootNavigator.tsx`

## Implementation sequence

1. Add route type in `src/app/navigation/types.ts`.
2. Create screen in feature UI folder.
3. If complex, create `use<ScreenName>VM` and move logic there.
4. If server access needed, add repository functions.
5. Add i18n keys in `src/app/localization/translations.ts`.
6. Register screen in root navigator.
7. Add tests for new logic.

## Guardrails

1. Do not import from another feature.
3. Prefer shared primitives:
   - `@/shared/ui/Text`
   - `@/shared/ui/Button`
   - `@/shared/ui/TextField`
   - `@/shared/ui/Surface`
4. Use `@/*` aliases.

## Templates

Use these templates as starting points:

- `docs/skills/new-screen/templates/simple-screen.tsx.template`
- `docs/skills/new-screen/templates/complex-screen.tsx.template`
- `docs/skills/new-screen/templates/use-screen-vm.ts.template`
- `docs/skills/new-screen/templates/repository.ts.template`

## Done definition

1. `npx tsc --noEmit` passes.
2. `npm test -- --runInBand` passes (or targeted tests with rationale).
3. Screen behavior matches acceptance criteria.
4. No cross-feature import introduced.
5. No new files created under legacy compatibility folders.
