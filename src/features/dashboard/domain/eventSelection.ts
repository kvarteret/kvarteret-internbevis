import {
    EventTaxonomy,
    EventTranslationSelection,
    EventTranslations,
    EventTypeGroup,
    KvarteretEventDocument,
} from "@/features/dashboard/domain/types"

const DEFAULT_HOME_EVENTS_MAX_COUNT = 5
const FALLBACK_TAXONOMY_GROUP = "Annet"

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

const resolveFeaturedEvents = (events: KvarteretEventDocument[]): KvarteretEventDocument[] => {
    const nearestFeaturedEventId = [...events]
        .filter(event => event.is_featured)
        .sort(
            (left, right) =>
                new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
        )[0]?.id

    if (!nearestFeaturedEventId) {
        return events
    }

    return events.map(event => ({
        ...event,
        is_featured: event.id === nearestFeaturedEventId,
    }))
}

export const pickHomeEvents = (
    events: KvarteretEventDocument[],
    options?: {
        now?: Date
        maxCount?: number
    },
): KvarteretEventDocument[] => {
    const now = options?.now ?? new Date()
    const maxCount = options?.maxCount ?? DEFAULT_HOME_EVENTS_MAX_COUNT

    return resolveFeaturedEvents(
        [...events]
            .filter(event => !isEventEnded(event, now))
            .filter(hasDisplayableTranslation)
            .sort(
                (left, right) =>
                    new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
            ),
    ).slice(0, maxCount)
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

    for (const event of resolveFeaturedEvents(events)) {
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
