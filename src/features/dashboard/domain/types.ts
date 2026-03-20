export interface EventTranslation {
    available: boolean
    title: string
    description: string | null
    image_caption: string | null
}

export interface EventTranslations {
    no: EventTranslation | null
    en: EventTranslation | null
}

export interface EventImage {
    url: string
    __typename: "supabase"
}

export interface EventType {
    id: string
    slug: string
    name: string
    description: string | null
    sort_order: number
    is_active: boolean
}

export interface OrganizerGroup {
    id: string
    slug: string
    name: string
    sort_order: number
    is_active: boolean
    default_event_type_id: string | null
}

export interface EventInstant {
    toDate: () => Date
    toMillis: () => number
    toISOString: () => string
}

export interface KvarteretEventDocument {
    id: string
    slug: string
    status: "published" | "draft" | "archived"
    event_start: EventInstant
    event_end: EventInstant
    created_at: EventInstant
    updated_at: EventInstant
    ticket_url: string | null
    facebook_url: string | null
    image: EventImage | null
    event_type_id: string
    event_type: EventType | null
    organizer_groups: OrganizerGroup[]
    is_internal: boolean
    is_featured: boolean
    recurring_interval_days: number | null
    price: string | null
    translations: EventTranslations
}

export interface EventTranslationSelection {
    language: "no" | "en"
    value: EventTranslation
}
