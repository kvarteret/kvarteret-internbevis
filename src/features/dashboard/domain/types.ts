export type SanityArrangementDate = {
    _key: string
    startDate: string
    startTime: string | null
    endTime: string | null
}

export type SanityRoom = {
    _id: string
    name: string
    slug: string
}

export type SanityOrganizerGroup = {
    _id: string
    name: string
    slug: string
}

export type SanityTaxonomyGroup = {
    _id: string
    name: string
    slug: string
}

export type SanityEventType = {
    _id: string
    name: string
    slug: string
    taxonomyGroup: SanityTaxonomyGroup | null
}

export type SanityPortableTextMarkDef = {
    _key: string
    _type: string
    href?: string
    target?: string
}

export type SanityPortableTextSpan = {
    _key: string
    _type: "span"
    text: string
    marks: string[]
}

export type SanityPortableTextBlock = {
    _key: string
    _type: "block"
    style: "normal" | "h1" | "h2" | "h3" | "blockquote"
    children: SanityPortableTextSpan[]
    markDefs: SanityPortableTextMarkDef[]
}

export type SanityArrangement = {
    _id: string
    title: string
    slug: string
    dates: SanityArrangementDate[]
    isRecurring: boolean | null
    rrule: string | null
    isFree: boolean | null
    priceOrdinar: number | null
    priceStudent: number | null
    priceMedlem: number | null
    ticketUrl: string | null
    facebookUrl: string | null
    imageUrl: string | null
    imageCaption: string | null
    room: SanityRoom | null
    roomText: string | null
    organizerGroup: SanityOrganizerGroup | null
    organizerText: string | null
    eventType: SanityEventType | null
    description: SanityPortableTextBlock[] | null
}

export type KvarteretEventDocument = SanityArrangement

export interface EventFeedEntry {
    event: KvarteretEventDocument
    upcomingDates: Date[]
}
