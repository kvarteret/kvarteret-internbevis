import {
    EventTranslationSelection,
    EventTranslations,
    KvarteretEventDocument,
} from "@/features/dashboard/domain/types"

const DEFAULT_HOME_EVENTS_MAX_COUNT = 5

export interface HomeEventSections {
    debates: KvarteretEventDocument[]
    concerts: KvarteretEventDocument[]
    others: KvarteretEventDocument[]
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
    event.event_end.toDate().getTime() < now.getTime()

const hasDisplayableTranslation = (event: KvarteretEventDocument): boolean =>
    selectEventTranslation(event.translations) !== null

const resolveFeaturedEvents = (
    events: KvarteretEventDocument[],
): KvarteretEventDocument[] => {
    const nearestFeaturedEventId = [...events]
        .filter(event => event.is_featured)
        .sort((left, right) => left.event_start.toMillis() - right.event_start.toMillis())[0]?.id

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
        .sort((left, right) => left.event_start.toMillis() - right.event_start.toMillis()),
    )
        .slice(0, maxCount)
}

const hasEventTypeSlug = (event: KvarteretEventDocument, slug: string): boolean =>
    event.event_type?.slug === slug

export const splitHomeEventsByType = (events: KvarteretEventDocument[]): HomeEventSections => {
    const sections: HomeEventSections = {
        debates: [],
        concerts: [],
        others: [],
    }

    for (const event of resolveFeaturedEvents(events)) {
        if (hasEventTypeSlug(event, "debatt")) {
            sections.debates.push(event)
            continue
        }

        if (hasEventTypeSlug(event, "konsert")) {
            sections.concerts.push(event)
            continue
        }

        sections.others.push(event)
    }

    return sections
}
