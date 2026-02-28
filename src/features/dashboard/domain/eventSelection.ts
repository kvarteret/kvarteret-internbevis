import {
    EventTranslationSelection,
    FirestoreEventDocument,
    FirestoreEventTranslations,
} from "@/features/dashboard/domain/types"

const DEFAULT_HOME_EVENTS_MAX_COUNT = 5
const EVENT_CATEGORY_ID_DEBATE = 10011
const EVENT_CATEGORY_ID_CONCERT = 10007

export interface HomeEventSections {
    debates: FirestoreEventDocument[]
    concerts: FirestoreEventDocument[]
    others: FirestoreEventDocument[]
}

export const selectEventTranslation = (
    translations: FirestoreEventTranslations,
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

const isEventEnded = (event: FirestoreEventDocument, now: Date): boolean =>
    event.event_end.toDate().getTime() < now.getTime()

const hasDisplayableTranslation = (event: FirestoreEventDocument): boolean =>
    selectEventTranslation(event.translations) !== null

export const pickHomeEvents = (
    events: FirestoreEventDocument[],
    options?: {
        now?: Date
        maxCount?: number
    },
): FirestoreEventDocument[] => {
    const now = options?.now ?? new Date()
    const maxCount = options?.maxCount ?? DEFAULT_HOME_EVENTS_MAX_COUNT

    return [...events]
        .filter(event => !isEventEnded(event, now))
        .filter(hasDisplayableTranslation)
        .sort((left, right) => left.event_start.toMillis() - right.event_start.toMillis())
        .slice(0, maxCount)
}

const hasCategoryId = (event: FirestoreEventDocument, categoryId: number): boolean =>
    event.categories.some(category => category.id === categoryId)

export const splitHomeEventsByType = (events: FirestoreEventDocument[]): HomeEventSections => {
    const sections: HomeEventSections = {
        debates: [],
        concerts: [],
        others: [],
    }

    for (const event of events) {
        if (hasCategoryId(event, EVENT_CATEGORY_ID_DEBATE)) {
            sections.debates.push(event)
            continue
        }

        if (hasCategoryId(event, EVENT_CATEGORY_ID_CONCERT)) {
            sections.concerts.push(event)
            continue
        }

        sections.others.push(event)
    }

    return sections
}
