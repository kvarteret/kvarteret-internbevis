import type {
    EventDetail,
    EventTaxonomy,
    EventTranslation,
    EventTranslations,
    EventTypeGroup,
} from "@/core/api/kvarteret-personal"

export type { EventDetail, EventTaxonomy, EventTranslation, EventTranslations, EventTypeGroup }

export type KvarteretEventDocument = EventDetail

export interface EventTranslationSelection {
    language: "no" | "en"
    value: EventTranslation
}
