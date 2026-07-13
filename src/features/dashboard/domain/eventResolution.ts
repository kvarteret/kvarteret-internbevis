import type {
    KvarteretEventDocument,
    RawKvarteretEventDocument,
    SanityEventParent,
    SanityEventStatus,
} from "@/features/dashboard/domain/types"

// Keep this list aligned with samfunnetibergen's canonical
// src/features/events/domain/resolveEvent.ts. Generated series instances and
// festival sessions omit these fields until an editor adds an override.
const resolveInherited = <Key extends keyof SanityEventParent>(
    event: RawKvarteretEventDocument,
    key: Key,
): SanityEventParent[Key] | null => event[key] ?? event.parent?.[key] ?? null

const resolveEffectiveStatus = (
    eventStatus: SanityEventStatus | null,
    parentStatus: SanityEventStatus | null | undefined,
): SanityEventStatus => {
    const childStatus = eventStatus ?? "scheduled"
    if (childStatus !== "scheduled") return childStatus
    return parentStatus && parentStatus !== "scheduled" ? parentStatus : "scheduled"
}

export const resolveEventDocument = (event: RawKvarteretEventDocument): KvarteretEventDocument => ({
    ...event,
    eventStatus: resolveEffectiveStatus(event.eventStatus, event.parent?.eventStatus),
    title: resolveInherited(event, "title") ?? "",
    description: resolveInherited(event, "description"),
    imageUrl: resolveInherited(event, "imageUrl"),
    imageCaption: resolveInherited(event, "imageCaption"),
    organizerGroup: resolveInherited(event, "organizerGroup"),
    organizerText: resolveInherited(event, "organizerText"),
    eventType: resolveInherited(event, "eventType"),
    isFree: resolveInherited(event, "isFree"),
    priceOrdinar: resolveInherited(event, "priceOrdinar"),
    priceStudent: resolveInherited(event, "priceStudent"),
    priceMedlem: resolveInherited(event, "priceMedlem"),
    ticketUrl: resolveInherited(event, "ticketUrl"),
    facebookUrl: resolveInherited(event, "facebookUrl"),
    isInternalEvent: resolveInherited(event, "isInternalEvent"),
})
