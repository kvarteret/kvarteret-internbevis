import { sanityFetch } from "@/core/sanity/client"
import { ARRANGEMENT_BY_ID_QUERY, PUBLISHED_ARRANGEMENTS_QUERY } from "@/core/sanity/queries"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { KvarteretEventDocument } from "@/features/dashboard/domain/types"

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
    _options: { includeInternal: boolean; language: "no" | "en" },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument[]> => {
    try {
        const events = await sanityFetch<KvarteretEventDocument[]>(PUBLISHED_ARRANGEMENTS_QUERY, {
            params: { today: toOsloDateString() },
            signal,
        })
        await writeCachedValue(EVENTS_CACHE_KEY, events)
        return events
    } catch (error) {
        const cached = await readCachedValue<KvarteretEventDocument[]>(
            EVENTS_CACHE_KEY,
            EVENTS_CACHE_TTL_MS,
        )
        if (cached) return cached
        throw error
    }
}

export const fetchEventById = async (
    eventId: string,
    _options: { includeInternal: boolean; language: "no" | "en" },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument> => {
    const cacheKey = `${EVENT_CACHE_KEY_PREFIX}:${eventId}`
    try {
        const event = await sanityFetch<KvarteretEventDocument | null>(ARRANGEMENT_BY_ID_QUERY, {
            params: { id: eventId },
            signal,
        })
        if (!event) throw new Error(`Event not found: ${eventId}`)
        await writeCachedValue(cacheKey, event)
        return event
    } catch (error) {
        const cached = await readCachedValue<KvarteretEventDocument>(
            cacheKey,
            EVENTS_CACHE_TTL_MS,
        )
        if (cached) return cached
        throw error
    }
}
