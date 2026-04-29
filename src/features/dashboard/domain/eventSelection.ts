import {
    EventTaxonomy,
    EventTranslationSelection,
    EventTranslations,
    EventTypeGroup,
    KvarteretEventDocument,
} from "@/features/dashboard/domain/types"

const DEFAULT_HOME_EVENTS_MAX_COUNT = 5
const FALLBACK_TAXONOMY_GROUP = "Annet"
const OSLO_TIME_ZONE = "Europe/Oslo"
const MS_PER_DAY = 24 * 60 * 60 * 1000

const TAXONOMY_GROUP_LABELS: Record<string, { no: string; en: string }> = {
    Musikk: { no: "Musikk", en: "Music" },
    Scenekunst: { no: "Scenekunst", en: "Performing arts" },
    Faglig: { no: "Faglig", en: "Talks and debates" },
    Sosialt: { no: "Sosialt", en: "Social events" },
    Organisasjon: { no: "Organisasjon", en: "Organization" },
    Annet: { no: "Annet", en: "Other events" },
}

export interface HomeEventSections {
    internal: KvarteretEventDocument[]
    taxonomyGroups: {
        key: string
        title: string
        events: KvarteretEventDocument[]
    }[]
}

export interface EventFilterState {
    taxonomyGroup: string | null
    eventTypeIds: string[]
    organizerGroupIds: string[]
}

export interface EventFeedSections {
    featured: KvarteretEventDocument[]
    today: KvarteretEventDocument[]
    soon: KvarteretEventDocument[]
    rest: KvarteretEventDocument[]
}

export const selectEventTranslation = (
    translations: EventTranslations,
): EventTranslationSelection | null => {
    const norwegian = translations.no
    if (norwegian && norwegian.title.trim().length > 0) {
        return {
            language: "no",
            value: norwegian,
        }
    }

    const english = translations.en
    if (english && english.title.trim().length > 0) {
        return {
            language: "en",
            value: english,
        }
    }

    return null
}

const isEventEnded = (event: KvarteretEventDocument, now: Date): boolean =>
    new Date(event.ends_at).getTime() < now.getTime()

const hasDisplayableTranslation = (event: KvarteretEventDocument): boolean =>
    event.title.trim().length > 0

export const pickHomeEvents = (
    events: KvarteretEventDocument[],
    options?: {
        now?: Date
        maxCount?: number
    },
): KvarteretEventDocument[] => {
    const now = options?.now ?? new Date()
    const maxCount = options?.maxCount ?? DEFAULT_HOME_EVENTS_MAX_COUNT

    return [...events]
        .filter(event => !isEventEnded(event, now))
        .filter(hasDisplayableTranslation)
        .sort(
            (left, right) =>
                new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
        )
        .slice(0, maxCount)
}

const getTaxonomyGroupName = (event: KvarteretEventDocument): string =>
    event.event_type?.taxonomy_group?.trim() || FALLBACK_TAXONOMY_GROUP

export const getLocalizedTaxonomyGroupName = (groupName: string, language: "no" | "en"): string =>
    TAXONOMY_GROUP_LABELS[groupName]?.[language] ?? groupName

const getTaxonomyGroupOrder = (taxonomy?: EventTaxonomy): EventTypeGroup[] =>
    taxonomy?.event_type_groups ?? []

export const splitHomeEventsByTaxonomy = (
    events: KvarteretEventDocument[],
    taxonomy: EventTaxonomy | undefined,
    language: "no" | "en",
): HomeEventSections => {
    const internal: KvarteretEventDocument[] = []
    const groupedEvents = new Map<string, KvarteretEventDocument[]>()

    for (const event of events) {
        if (event.is_internal) {
            internal.push(event)
            continue
        }

        const groupName = getTaxonomyGroupName(event)
        groupedEvents.set(groupName, [...(groupedEvents.get(groupName) ?? []), event])
    }

    const orderedGroupNames = getTaxonomyGroupOrder(taxonomy).map(group => group.name)
    const fallbackGroupNames = [...groupedEvents.keys()].filter(
        groupName => !orderedGroupNames.includes(groupName),
    )
    const taxonomyGroups = [...orderedGroupNames, ...fallbackGroupNames]
        .map(groupName => ({
            key: groupName,
            title: getLocalizedTaxonomyGroupName(groupName, language),
            events: groupedEvents.get(groupName) ?? [],
        }))
        .filter(group => group.events.length > 0)

    return {
        internal,
        taxonomyGroups,
    }
}

const osloDateFormatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: OSLO_TIME_ZONE,
    year: "numeric",
})

const getOsloCalendarDayNumber = (date: Date): number => {
    const parts = osloDateFormatter.formatToParts(date)
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
    const year = Number(values.year)
    const month = Number(values.month)
    const day = Number(values.day)

    return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

const sortEventsByStart = (events: KvarteretEventDocument[]): KvarteretEventDocument[] =>
    [...events].sort(
        (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    )

const shuffleEvents = (
    events: KvarteretEventDocument[],
    random: () => number,
): KvarteretEventDocument[] => {
    const shuffledEvents = [...events]

    for (let index = shuffledEvents.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1))
        const currentEvent = shuffledEvents[index]
        const swapEvent = shuffledEvents[swapIndex]
        if (!currentEvent || !swapEvent) continue
        shuffledEvents[index] = swapEvent
        shuffledEvents[swapIndex] = currentEvent
    }

    return shuffledEvents
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
    if (!value || typeof value !== "object") {
        return null
    }

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

export const filterEvents = (
    events: KvarteretEventDocument[],
    filters: EventFilterState,
): KvarteretEventDocument[] => {
    const eventTypeIds = new Set(filters.eventTypeIds)
    const organizerGroupIds = new Set(filters.organizerGroupIds)

    return sortEventsByStart(events).filter(event => {
        if (filters.taxonomyGroup && getTaxonomyGroupName(event) !== filters.taxonomyGroup) {
            return false
        }

        if (eventTypeIds.size > 0 && !eventTypeIds.has(event.event_type_id)) {
            return false
        }

        if (
            organizerGroupIds.size > 0 &&
            !event.organizer_groups.some(group => organizerGroupIds.has(group.id))
        ) {
            return false
        }

        return true
    })
}

export const buildEventFeedSections = (
    events: KvarteretEventDocument[],
    now = new Date(),
    random: () => number = Math.random,
): EventFeedSections => {
    const sortedEvents = sortEventsByStart(events)
    const todayDayNumber = getOsloCalendarDayNumber(now)
    const featured = shuffleEvents(
        sortedEvents.filter(event => event.is_featured),
        random,
    )
    const featuredEventIds = new Set(featured.map(event => event.id))
    const today = sortedEvents.filter(
        event =>
            !featuredEventIds.has(event.id) &&
            getOsloCalendarDayNumber(new Date(event.starts_at)) === todayDayNumber,
    )
    const soon = sortedEvents.filter(event => {
        if (featuredEventIds.has(event.id)) {
            return false
        }

        const daysUntil = getOsloCalendarDayNumber(new Date(event.starts_at)) - todayDayNumber
        return daysUntil >= 1 && daysUntil <= 7
    })
    const groupedEventIds = new Set([
        ...featuredEventIds,
        ...today.map(event => event.id),
        ...soon.map(event => event.id),
    ])

    return {
        featured,
        rest: sortedEvents.filter(event => !groupedEventIds.has(event.id)),
        soon,
        today,
    }
}
