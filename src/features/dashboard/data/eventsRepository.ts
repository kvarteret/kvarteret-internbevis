import { appEnv } from "@/app/config/env"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { pickHomeEvents, selectEventTranslation } from "@/features/dashboard/domain/eventSelection"
import { KvarteretEventDocument } from "@/features/dashboard/domain/types"

const HOME_EVENTS_QUERY_LIMIT = 30
const EVENTS_CACHE_KEY_PREFIX = "supabase_cache:events:home"
const EVENT_CACHE_KEY_PREFIX = "supabase_cache:event"
const EVENTS_CACHE_TTL_MS = 15 * 60 * 1000

type EventRow = {
    id: string
    slug: string
    status: KvarteretEventDocument["status"]
    event_start: string
    event_end: string
    created_at: string
    updated_at: string
    ticket_url: string | null
    facebook_url: string | null
    image_url: string | null
    price: string | null
    event_type_id: string
    is_internal: boolean
    is_featured: boolean
    recurring_interval_days: number | null
    translations: KvarteretEventDocument["translations"]
    event_type: KvarteretEventDocument["event_type"]
    event_organizer_group_memberships:
        | {
              display_order: number
              organizer_group: KvarteretEventDocument["organizer_groups"][number] | null
          }[]
        | null
}

interface CachedPayload<T> {
    cachedAt: number
    value: T
}

const EVENT_SELECT = [
    "id",
    "slug",
    "status",
    "event_start",
    "event_end",
    "created_at",
    "updated_at",
    "ticket_url",
    "facebook_url",
    "image_url",
    "price",
    "event_type_id",
    "is_internal",
    "is_featured",
    "recurring_interval_days",
    "translations",
    "event_type:event_types(id,slug,name,description,sort_order,is_active)",
    "event_organizer_group_memberships(display_order,organizer_group:event_organizer_groups(id,slug,name,sort_order,is_active,default_event_type_id))",
].join(",")

const toEventInstant = (value: string) => {
    const date = new Date(value)
    return {
        toDate: () => new Date(date),
        toMillis: () => date.getTime(),
        toISOString: () => date.toISOString(),
    }
}

const serializeEvent = (event: KvarteretEventDocument): EventRow => ({
    id: event.id,
    slug: event.slug,
    status: event.status,
    event_start: event.event_start.toISOString(),
    event_end: event.event_end.toISOString(),
    created_at: event.created_at.toISOString(),
    updated_at: event.updated_at.toISOString(),
    ticket_url: event.ticket_url,
    facebook_url: event.facebook_url,
    image_url: event.image?.url ?? null,
    price: event.price,
    event_type_id: event.event_type_id,
    is_internal: event.is_internal,
    is_featured: event.is_featured,
    recurring_interval_days: event.recurring_interval_days,
    translations: event.translations,
    event_type: event.event_type,
    event_organizer_group_memberships: event.organizer_groups.map((organizer_group, index) => ({
        display_order: index,
        organizer_group,
    })),
})

const mapEventRow = (row: EventRow): KvarteretEventDocument => ({
    id: row.id,
    slug: row.slug,
    status: row.status,
    event_start: toEventInstant(row.event_start),
    event_end: toEventInstant(row.event_end),
    created_at: toEventInstant(row.created_at),
    updated_at: toEventInstant(row.updated_at),
    ticket_url: row.ticket_url,
    facebook_url: row.facebook_url,
    image: row.image_url
        ? {
              url: row.image_url,
              __typename: "supabase",
          }
        : null,
    event_type_id: row.event_type_id,
    event_type: row.event_type,
    organizer_groups: [...(row.event_organizer_group_memberships ?? [])]
        .sort((left, right) => left.display_order - right.display_order)
        .map(membership => membership.organizer_group)
        .filter(Boolean) as KvarteretEventDocument["organizer_groups"],
    is_internal: row.is_internal,
    is_featured: row.is_featured,
    recurring_interval_days: row.recurring_interval_days,
    price: row.price,
    translations: row.translations,
})

const getHomeEventsCacheKey = (includeInternal: boolean): string =>
    `${EVENTS_CACHE_KEY_PREFIX}:${includeInternal ? "internal" : "public"}`

const getEventCacheKey = (eventId: string, includeInternal: boolean): string =>
    `${EVENT_CACHE_KEY_PREFIX}:${includeInternal ? "internal" : "public"}:${eventId}`

const readCachedValue = async <T, U>(
    key: string,
    maxAgeMs: number,
    deserialize: (value: T) => U,
): Promise<U | null> => {
    try {
        const payload = await getStoredJson<CachedPayload<T>>(key)
        if (!payload) {
            return null
        }

        const ageMs = Date.now() - payload.cachedAt
        if (ageMs > maxAgeMs) {
            return null
        }

        return deserialize(payload.value)
    } catch {
        return null
    }
}

const writeCachedValue = async <T>(key: string, value: T): Promise<void> => {
    try {
        await setStoredJson(key, {
            cachedAt: Date.now(),
            value,
        })
    } catch {
        // Ignore cache write failures and keep network responses authoritative.
    }
}

const fetchEventsFromSupabase = async (
    options: {
        eventId?: string
        includeInternal: boolean
        limit?: number
    },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument[]> => {
    const url = new URL("/rest/v1/events", appEnv.supabaseUrl)
    url.searchParams.set("select", EVENT_SELECT)
    url.searchParams.set("status", "eq.published")
    url.searchParams.set("order", "event_start.asc")

    if (!options.includeInternal) {
        url.searchParams.set("is_internal", "eq.false")
    }

    if (options.eventId) {
        url.searchParams.set("id", `eq.${options.eventId}`)
    }

    if (options.limit) {
        url.searchParams.set("limit", String(options.limit))
    }

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            apikey: appEnv.supabaseAnonKey,
            Authorization: `Bearer ${appEnv.supabaseAnonKey}`,
            Accept: "application/json",
        },
        signal,
    })

    if (!response.ok) {
        throw new Error(`Unable to fetch events (${response.status}).`)
    }

    const data = (await response.json()) as EventRow[]
    return data.map(mapEventRow)
}

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

export const fetchHomeEvents = async (
    options: {
        includeInternal: boolean
    },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument[]> => {
    const cacheKey = getHomeEventsCacheKey(options.includeInternal)

    try {
        const events = await fetchEventsFromSupabase(
            {
                includeInternal: options.includeInternal,
                limit: HOME_EVENTS_QUERY_LIMIT,
            },
            signal,
        )
        const pickedEvents = pickHomeEvents(resolveFeaturedEvents(events), {
            maxCount: HOME_EVENTS_QUERY_LIMIT,
        })

        await writeCachedValue(cacheKey, pickedEvents.map(serializeEvent))

        return pickedEvents
    } catch (error) {
        const cachedEvents = await readCachedValue<EventRow[], KvarteretEventDocument[]>(
            cacheKey,
            EVENTS_CACHE_TTL_MS,
            value => value.map(mapEventRow),
        )

        if (cachedEvents) {
            return cachedEvents
        }

        throw error
    }
}

export const fetchEventById = async (
    eventId: string,
    options: {
        includeInternal: boolean
    },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument> => {
    const cacheKey = getEventCacheKey(eventId, options.includeInternal)

    try {
        const events = await fetchEventsFromSupabase(
            {
                eventId,
                includeInternal: options.includeInternal,
            },
            signal,
        )

        const event = events[0]
        if (!event) {
            throw new Error("Event not found.")
        }

        const resolvedEvent = resolveFeaturedEvents([event])[0]
        await writeCachedValue(cacheKey, serializeEvent(resolvedEvent))
        return resolvedEvent
    } catch (error) {
        const cachedEvent = await readCachedValue<EventRow, KvarteretEventDocument>(
            cacheKey,
            EVENTS_CACHE_TTL_MS,
            mapEventRow,
        )

        if (cachedEvent) {
            return cachedEvent
        }

        throw error
    }
}

export { pickHomeEvents, selectEventTranslation }
