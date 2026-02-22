import {
    EventTranslationSelection,
    FirestoreEventDocument,
    FirestoreEventTranslations,
} from "@/features/dashboard/domain/types"

const DEFAULT_HOME_EVENTS_MAX_COUNT = 5

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
