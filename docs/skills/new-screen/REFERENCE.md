# New Screen Reference (Example Flow)

This file shows how to apply the `new-screen` skill in this repository.

## Example choice

Scenario: add `EventAgendaScreen` under `dashboard`.

Decision:

- Use **simple screen** if it only renders agenda from one query.
- Use **VM screen** if it supports filters, retries, and deep link selection.

## Example file map

Simple:

- `src/features/dashboard/ui/screens/EventAgendaScreen.tsx`

Complex:

- `src/features/dashboard/ui/screens/EventAgendaScreen.tsx`
- `src/features/dashboard/vm/useEventAgendaScreenVM.ts`
- `src/features/dashboard/data/eventsRepository.ts` (add fetcher)

## Example acceptance criteria

1. Route added to `src/app/navigation/types.ts`.
2. Screen added in `src/app/navigation/RootNavigator.tsx`.
3. Feature boundary preserved (no import from another feature).
4. Uses shared primitives (`Text`, `Button`, `Surface`) where applicable.
5. New query keys are namespaced and stable.
6. Added test coverage for non-trivial VM logic.
