# ADR-0001: Lenient Backend Response Schemas

## Status

Accepted

## Context

The mobile app and the Kvarteret Personal backend are owned together, but they are not deployed together. Installed app versions can remain in use after the backend has changed. A backend-only addition to the mobile-card response can therefore break older app versions if the app rejects unknown response fields.

This happened when `role_history` was added to the mobile-card response before the deployed app had a parser that allowed additive fields. Some users were logged out or blocked during login because the app treated the otherwise valid response as an unexpected schema error.

## Decision

Backend response schemas in the mobile app must be forward-compatible. Zod schemas for backend responses must allow unknown additive fields at every object level with `.passthrough()` or an equivalent parser policy.

Strict schemas remain appropriate for app-owned request payloads, local persisted formats, and other data where this app controls both writer and reader.

Temporary backend compatibility gates, such as `include_role_history`, must include an explicit TODO and removal condition. Backend response additions must not be sent by default to deployed clients until all supported app versions use lenient response parsing for that endpoint.

## Consequences

Additive backend fields should no longer log out users or block login in installed app versions.

Removing, renaming, or changing the type of required fields remains a breaking change. Those changes require versioning, a fallback period, or an app release that can tolerate both shapes.

Parser tests for backend responses must include unknown future fields at nested response levels.
