import { sanityFetch } from "@/core/sanity/client"
import { ARRANGEMENT_BY_ID_QUERY, PUBLISHED_ARRANGEMENTS_QUERY } from "@/core/sanity/queries"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { parseRawEvent, parseRawEvents } from "@/features/dashboard/data/eventSchema"
import { resolveEventDocument } from "@/features/dashboard/domain/eventResolution"
import type { KvarteretEventDocument } from "@/features/dashboard/domain/types"

const EVENTS_CACHE_KEY = "events_sanity_cache:home"
const EVENT_CACHE_KEY_PREFIX = "events_sanity_cache:event"
const EVENTS_CACHE_TTL_MS = 15 * 60 * 1000

interface CachedPayload<T> {
    cachedAt: number
    value: T
}

const toOsloDateString = (): string =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())

const readCachedValue = async <T>(key: string, maxAgeMs: number): Promise<T | null> => {
    try {
        const payload = await getStoredJson<CachedPayload<T>>(key)
        if (!payload) return null
        if (Date.now() - payload.cachedAt > maxAgeMs) return null
        return payload.value
    } catch {
        return null
    }
}

const writeCachedValue = async <T>(key: string, value: T): Promise<void> => {
    try {
        await setStoredJson(key, { cachedAt: Date.now(), value })
    } catch {
        // Ignore cache write failures — network response stays authoritative.
    }
}

export const fetchHomeEvents = async (
    options: { includeInternal: boolean },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument[]> => {
    // Offline cache is scoped by visibility so an anonymous session can never
    // read a cached internal-inclusive feed.
    const cacheKey = `${EVENTS_CACHE_KEY}:${options.includeInternal ? "internal" : "public"}`
    try {
        const payload = await sanityFetch<unknown>(PUBLISHED_ARRANGEMENTS_QUERY, {
            params: { today: toOsloDateString(), includeInternal: options.includeInternal },
            signal,
        })
        const rawEvents = parseRawEvents(payload)
        const events = rawEvents.map(resolveEventDocument)
        await writeCachedValue(cacheKey, events)
        return events
    } catch (error) {
        const cached = await readCachedValue<KvarteretEventDocument[]>(
            cacheKey,
            EVENTS_CACHE_TTL_MS,
        )
        if (cached) return cached
        throw error
    }
}

export const fetchEventById = async (
    eventId: string,
    options: { includeInternal: boolean },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument> => {
    const cacheKey = `${EVENT_CACHE_KEY_PREFIX}:${eventId}:${options.includeInternal ? "internal" : "public"}`
    try {
        const payload = await sanityFetch<unknown>(ARRANGEMENT_BY_ID_QUERY, {
            params: { id: eventId, includeInternal: options.includeInternal },
            signal,
        })
        if (!payload) throw new Error(`Event not found: ${eventId}`)
        const rawEvent = parseRawEvent(payload)
        const event = resolveEventDocument(rawEvent)
        await writeCachedValue(cacheKey, event)
        return event
    } catch (error) {
        const cached = await readCachedValue<KvarteretEventDocument>(cacheKey, EVENTS_CACHE_TTL_MS)
        if (cached) return cached
        throw error
    }
}
