# ADR-0002: Public event occurrence projections

**Status:** Accepted (supersedes the client-side recurrence strategy)

**Date:** 2026-05-09

**Updated:** 2026-09-04

**Deciders:** Martin Kleiven (E-Tjenesten)

## Context

The app previously queried event documents directly from Sanity and expanded
recurrence rules on the device. That duplicated the public website's event
inheritance, visibility, localization, and recurrence behavior. It also meant
the app could disagree with the canonical event calendar.

Samfunnet now exposes an anonymous occurrence API at
`https://www.samfunnetibergen.no/api/v1/events`, documented by
`https://www.samfunnetibergen.no/api/v1/openapi.json`.

Each response item is a concrete occurrence with:

- an opaque occurrence ID;
- a timed or date-only schedule in `Europe/Oslo`;
- localized event content;
- resolved parent, taxonomy, organizer, location, pricing, and links.

## Decision

The public occurrence API is the app's only event data boundary. The generated
client is checked in and verified against the OpenAPI document in CI.

The app derives two projections from the ordered occurrence stream:

1. **Arrangement list:** group occurrences by parent event ID, falling back to
   event ID. Render the first occurrence as the card and the remaining
   occurrences as upcoming-date chips.
2. **Calendar:** retain every occurrence, group by local Oslo date, and include
   empty days and intervening months from the start of the current week through
   the final returned occurrence.

Event routes use the opaque occurrence ID so details represent the exact date
the user selected. The API's `from` and `to` parameters define the inclusive
calendar range.

The repository uses ETag revalidation and may serve a recently cached snapshot
after a temporary network failure. Norwegian app locale `no` maps to API locale
`nb`.

## Consequences

### Positive

- The app and website share event visibility and recurrence semantics.
- Series and festival inheritance is resolved once, server-side.
- Date-only occurrences remain date-only; the app does not invent a time.
- The same response can represent both a compact list and a complete calendar.
- Specific occurrences can be linked and rendered consistently.

### Trade-offs

- Public events depend on the website API being available.
- The app no longer displays unpublished or internal Sanity event documents.
- Contract drift must be resolved by regenerating and reviewing the client.

## Alternatives considered

**Continue querying Sanity directly** — rejected because it duplicates canonical
website behavior and exposes the app to schema-level implementation details.

**Expand RRULE values on the device** — superseded because the API supplies
materialized occurrences.

**Show every occurrence as a list card** — rejected because recurring series can
dominate the arrangement list. The calendar projection still preserves every
occurrence.

## Related

- [ADR-0001](./ADR-0001-lenient-backend-response-schemas.md) — Lenient backend response schemas
