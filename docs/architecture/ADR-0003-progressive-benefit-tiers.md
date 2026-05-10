# ADR-0003: Progressive (Cumulative) Benefit Tiers

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Martin Kleiven (E-Tjenesten)

---

## Context

Intern benefits ("interngoder") at Kvarteret are organised into three tiers:

| Tier | Label | Organisation type |
|---|---|---|
| Trinn 1 | Brukerorganisasjon | Basic member organisations |
| Trinn 2 | Driftsorganisasjon | Operational organisations |
| Trinn 3 | Arbeidsgruppe | Working groups |

Each benefit in Sanity carries a `minimumTier` field (`"trinn1"` / `"trinn2"` / `"trinn3"`), indicating the lowest tier that qualifies for it.

The original implementation filtered benefits by exact match:

```typescript
// BEFORE (incorrect)
const selectedItems = benefits.filter(b => b.minimumTier === selectedTier)
```

This meant a user on Trinn 3 viewing the Trinn 3 tab would only see benefits explicitly marked `"trinn3"`, missing all benefits inherited from Trinn 1 and Trinn 2.

---

## Decision

Benefits are **progressive** (cumulative): a higher tier inherits all benefits from every tier below it. The filter uses `<=` on the numeric tier value:

```typescript
const selectedItems = benefits.filter(
    b => TIER_TO_NUMBER[b.minimumTier] <= TIER_TO_NUMBER[selectedTier],
)
```

With the existing `TIER_TO_NUMBER` map (`trinn1 → 1`, `trinn2 → 2`, `trinn3 → 3`), viewing the Trinn 3 tab now returns all benefits with `minimumTier` of 1, 2, or 3.

### Resulting behaviour

| Tab selected | Benefits shown |
|---|---|
| Trinn 1 | `minimumTier: trinn1` |
| Trinn 2 | `minimumTier: trinn1` + `trinn2` |
| Trinn 3 | `minimumTier: trinn1` + `trinn2` + `trinn3` |

### Sanity data model implication

`minimumTier` on a benefit document means *"this benefit is available from this tier upwards"*, not *"exclusive to this tier"*. Editors should set `minimumTier` to the lowest tier that qualifies, not the tier they wish to target exclusively.

---

## Consequences

### Positive

- Higher-tier users see the complete set of benefits they are entitled to.
- No changes to the Sanity data model or content are required.
- Single-line fix with no performance impact.

### Negative / trade-offs

- If a benefit must be exclusive to one tier (not inherited upward), the current `minimumTier` field cannot express that. A separate `maxTier` field would be needed. This is considered an edge case not present in current content.

---

## Alternatives considered

**Add a `maxTier` field** — allows exclusive tier targeting. Rejected as unnecessarily complex; all known benefits are inclusive upward.

**Separate benefit lists per tier in Sanity** — rejected: duplicates content and creates maintenance burden.

---

## Related

- [ADR-0001](./ADR-0001-lenient-backend-response-schemas.md) — Lenient backend response schemas
- [ADR-0002](./ADR-0002-recurrent-events-display.md) — Recurrent events display strategy
