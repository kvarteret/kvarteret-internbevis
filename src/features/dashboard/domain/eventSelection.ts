import { expandRruleUpcomingDates, toOsloDate } from "@/features/dashboard/domain/eventFormatting"
import { EventFeedEntry, KvarteretEventDocument } from "@/features/dashboard/domain/types"

const FALLBACK_TAXONOMY_GROUP = "Annet"
const OSLO_TIME_ZONE = "Europe/Oslo"
export const TAXONOMY_GROUP_ORDER = ["Musikk", "Scenekunst", "Faglig", "Sosialt", "Organisasjon"]

const TAXONOMY_GROUP_LABELS: Record<string, { no: string; en: string }> = {
    Musikk: { no: "Musikk", en: "Music" },
    Scenekunst: { no: "Scenekunst", en: "Performing arts" },
    Faglig: { no: "Faglig", en: "Talks and debates" },
    Sosialt: { no: "Sosialt", en: "Social events" },
    Organisasjon: { no: "Organisasjon", en: "Organization" },
    Annet: { no: "Annet", en: "Other events" },
}

// ─── Taxonomy derivation ───────────────────────────────────────────────────

export interface DerivedEventType {
    _id: string
    name: string
    slug: string
}

export interface DerivedTaxonomyGroup {
    name: string
    eventTypes: DerivedEventType[]
}

export interface DerivedOrganizerGroup {
    _id: string
    name: string
}

export interface DerivedTaxonomy {
    taxonomyGroups: DerivedTaxonomyGroup[]
    organizerGroups: DerivedOrganizerGroup[]
}

export const deriveTaxonomyFromEvents = (events: KvarteretEventDocument[]): DerivedTaxonomy => {
    const groupToTypes = new Map<string, Map<string, DerivedEventType>>()
    const organizerGroupMap = new Map<string, DerivedOrganizerGroup>()

    for (const event of events) {
        if (event.eventType) {
            const groupName = event.eventType.taxonomyGroup?.name ?? FALLBACK_TAXONOMY_GROUP
            if (!groupToTypes.has(groupName)) {
                groupToTypes.set(groupName, new Map())
            }
            groupToTypes.get(groupName)!.set(event.eventType._id, {
                _id: event.eventType._id,
                name: event.eventType.name,
                slug: event.eventType.slug,
            })
        }
        if (event.organizerGroup) {
            organizerGroupMap.set(event.organizerGroup._id, {
                _id: event.organizerGroup._id,
                name: event.organizerGroup.name,
            })
        }
    }

    const orderedNames = TAXONOMY_GROUP_ORDER.filter(name => groupToTypes.has(name))
    const remainingNames = [...groupToTypes.keys()].filter(
        name => !TAXONOMY_GROUP_ORDER.includes(name),
    )

    const taxonomyGroups: DerivedTaxonomyGroup[] = [...orderedNames, ...remainingNames].map(
        name => ({
            name,
            eventTypes: [...(groupToTypes.get(name)?.values() ?? [])],
        }),
    )

    return {
        taxonomyGroups,
        organizerGroups: [...organizerGroupMap.values()],
    }
}

// ─── Filter state ──────────────────────────────────────────────────────────

export interface EventFilterState {
    taxonomyGroup: string | null
    eventTypeIds: string[]
    organizerGroupIds: string[]
}

export interface EventFeedSections {
    rest: EventFeedEntry[]
}

export const createEmptyEventFilterState = (): EventFilterState => ({
    eventTypeIds: [],
    organizerGroupIds: [],
    taxonomyGroup: null,
})

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === "string")

const uniqueStrings = (values: string[]): string[] => [...new Set(values)]

export const parsePersistedEventFilterState = (value: unknown): EventFilterState | null => {
    if (!value || typeof value !== "object") return null
    const candidate = value as Record<string, unknown>
    const taxonomyGroup = candidate.taxonomyGroup
    if (
        taxonomyGroup !== null &&
        taxonomyGroup !== undefined &&
        typeof taxonomyGroup !== "string"
    ) {
        return null
    }
    if (!isStringArray(candidate.eventTypeIds) || !isStringArray(candidate.organizerGroupIds)) {
        return null
    }
    return {
        eventTypeIds: uniqueStrings(candidate.eventTypeIds),
        organizerGroupIds: uniqueStrings(candidate.organizerGroupIds),
        taxonomyGroup: taxonomyGroup?.trim() || null,
    }
}

export const countActiveEventFilters = (filters: EventFilterState): number =>
    (filters.taxonomyGroup ? 1 : 0) + filters.eventTypeIds.length + filters.organizerGroupIds.length

// ─── Taxonomy helpers ──────────────────────────────────────────────────────

const getEventTaxonomyGroupName = (event: KvarteretEventDocument): string =>
    event.eventType?.taxonomyGroup?.name?.trim() || FALLBACK_TAXONOMY_GROUP

export const getLocalizedTaxonomyGroupName = (groupName: string, language: "no" | "en"): string =>
    TAXONOMY_GROUP_LABELS[groupName]?.[language] ?? groupName

// ─── Filtering ─────────────────────────────────────────────────────────────

export const filterEvents = (
    events: KvarteretEventDocument[],
    filters: EventFilterState,
): KvarteretEventDocument[] => {
    const eventTypeIds = new Set(filters.eventTypeIds)
    const organizerGroupIds = new Set(filters.organizerGroupIds)

    return events.filter(event => {
        if (filters.taxonomyGroup && getEventTaxonomyGroupName(event) !== filters.taxonomyGroup) {
            return false
        }
        if (eventTypeIds.size > 0 && !eventTypeIds.has(event.eventType?._id ?? "")) {
            return false
        }
        if (organizerGroupIds.size > 0 && !organizerGroupIds.has(event.organizerGroup?._id ?? "")) {
            return false
        }
        return true
    })
}

// ─── Feed sections ─────────────────────────────────────────────────────────

const osloShortDateFormatter = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    timeZone: OSLO_TIME_ZONE,
})

export const buildUpcomingDateChips = (upcomingDates: Date[]): string[] => {
    if (upcomingDates.length === 0) return []
    const chips: string[] = []
    const [first, second, ...rest] = upcomingDates
    if (first) chips.push(osloShortDateFormatter.format(first))
    if (second) chips.push(osloShortDateFormatter.format(second))
    if (rest.length > 0) chips.push(rest.length >= 9 ? "9+" : `+${rest.length}`)
    return chips
}

const getUpcomingDates = (event: KvarteretEventDocument): Date[] => {
    const first = event.dates[0]
    if (event.isRecurring && event.rrule && first) {
        return expandRruleUpcomingDates(first.startDate, first.startTime, event.rrule)
    }
    return event.dates.slice(1).map(d => toOsloDate(d.startDate, d.startTime))
}

export const buildEventFeedSections = (events: KvarteretEventDocument[]): EventFeedSections => ({
    rest: events.map(event => ({
        event,
        upcomingDates: getUpcomingDates(event),
    })),
})
