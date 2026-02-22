import type { Timestamp } from "firebase/firestore"

export interface FirestoreEventTranslation {
    available: boolean
    title: string
    description: string | null
    content: string | null
    image_caption: string | null
}

export interface FirestoreEventTranslations {
    no: FirestoreEventTranslation | null
    en: FirestoreEventTranslation | null
}

export interface FirestoreEventImage {
    url: string
    __typename: "firestore"
}

export interface FirestoreEventDocument {
    id: string
    slug: string
    status: "published" | "draft" | "archived"
    event_start: Timestamp
    event_end: Timestamp
    created_at: Timestamp
    updated_at: Timestamp
    ticket_url: string | null
    facebook_url: string | null
    image: FirestoreEventImage | null
    organizer: { id: number | null; name: string } | null
    categories: { id: number; name: string }[]
    price: string | null
    translations: FirestoreEventTranslations
}

export interface EventTranslationSelection {
    language: "no" | "en"
    value: FirestoreEventTranslation
}
