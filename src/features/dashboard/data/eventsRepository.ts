import { appEnv } from "@/app/config/env"
import type { EventDetail, EventList, EventTaxonomy } from "@/core/api/kvarteret-personal"
import { getEvent, getEventTaxonomy, listEvents } from "@/core/api/kvarteret-personal"
import { client } from "@/core/api/kvarteret-personal/client.gen"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { getSessionValue, SESSION_STORAGE_KEYS } from "@/core/storage/sessionStorage"
import { pickHomeEvents, selectEventTranslation } from "@/features/dashboard/domain/eventSelection"
import { KvarteretEventDocument } from "@/features/dashboard/domain/types"

const HOME_EVENTS_QUERY_LIMIT = 100
const EVENTS_CACHE_KEY_PREFIX = "events_api_cache:events:home"
const EVENT_CACHE_KEY_PREFIX = "events_api_cache:event"
const EVENTS_CACHE_TTL_MS = 15 * 60 * 1000

interface CachedPayload<T> {
    cachedAt: number
    value: T
}

type EventLanguage = "no" | "en"

const getClientBaseUrl = (): string =>
    appEnv.kvarteretPersonalApiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")

const configureClient = (): void => {
    client.setConfig({
        baseUrl: getClientBaseUrl(),
    })
}

const getStoredMobileCardToken = async (): Promise<string | null> => {
    const token = await getSessionValue(SESSION_STORAGE_KEYS.accessToken)
    const trimmedToken = token?.trim()
    return trimmedToken ? trimmedToken : null
}

const getAuthorizationHeader = (token: string | null): string | undefined =>
    token ? `Bearer ${token}` : undefined

const getHomeEventsCacheKey = (includeInternal: boolean, language: EventLanguage): string =>
    `${EVENTS_CACHE_KEY_PREFIX}:${includeInternal ? "internal" : "public"}:${language}`

const getEventCacheKey = (
    eventId: string,
    includeInternal: boolean,
    language: EventLanguage,
): string =>
    `${EVENT_CACHE_KEY_PREFIX}:${includeInternal ? "internal" : "public"}:${language}:${eventId}`

const readCachedValue = async <T>(key: string, maxAgeMs: number): Promise<T | null> => {
    try {
        const payload = await getStoredJson<CachedPayload<T>>(key)
        if (!payload) {
            return null
        }

        const ageMs = Date.now() - payload.cachedAt
        if (ageMs > maxAgeMs) {
            return null
        }

        return payload.value
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

const unwrapApiResponse = <T>(
    result: {
        data?: T
        error?: unknown
        response: Response
    },
    fallbackMessage: string,
): T => {
    if (!result.response.ok || result.error || !result.data) {
        throw new Error(`${fallbackMessage} (${result.response.status}).`)
    }

    return result.data
}

const fetchEventList = async (
    options: {
        includeInternal: boolean
        language: EventLanguage
        limit?: number
    },
    signal?: AbortSignal,
): Promise<EventList> => {
    configureClient()

    const token = await getStoredMobileCardToken()
    const includeInternal = options.includeInternal && Boolean(token)
    const authorization = getAuthorizationHeader(token)
    const result = await listEvents({
        headers: {
            "accept-language": options.language,
            ...(authorization ? { authorization } : {}),
        },
        query: {
            include_internal: includeInternal,
            limit: options.limit,
        },
        signal,
    })

    return unwrapApiResponse(result, "Unable to fetch events")
}

const fetchEventDetail = async (
    eventId: string,
    options: {
        includeInternal: boolean
        language: EventLanguage
    },
    signal?: AbortSignal,
): Promise<EventDetail> => {
    configureClient()

    const token = await getStoredMobileCardToken()
    const authorization = getAuthorizationHeader(token)
    const result = await getEvent({
        headers: {
            "accept-language": options.language,
            ...(authorization ? { authorization } : {}),
        },
        path: {
            event_id: eventId,
        },
        signal,
    })

    return unwrapApiResponse(result, "Unable to fetch event")
}

export const fetchEventTaxonomy = async (signal?: AbortSignal): Promise<EventTaxonomy> => {
    configureClient()

    const result = await getEventTaxonomy({
        signal,
    })

    return unwrapApiResponse(result, "Unable to fetch event taxonomy")
}

export const fetchHomeEvents = async (
    options: {
        includeInternal: boolean
        language: EventLanguage
    },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument[]> => {
    const token = await getStoredMobileCardToken()
    const includeInternal = options.includeInternal && Boolean(token)
    const cacheKey = getHomeEventsCacheKey(includeInternal, options.language)

    try {
        const eventList = await fetchEventList(
            {
                includeInternal,
                language: options.language,
                limit: HOME_EVENTS_QUERY_LIMIT,
            },
            signal,
        )
        const pickedEvents = eventList.events

        await writeCachedValue(cacheKey, pickedEvents)

        return pickedEvents
    } catch (error) {
        const cachedEvents = await readCachedValue<KvarteretEventDocument[]>(
            cacheKey,
            EVENTS_CACHE_TTL_MS,
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
        language: EventLanguage
    },
    signal?: AbortSignal,
): Promise<KvarteretEventDocument> => {
    const token = await getStoredMobileCardToken()
    const includeInternal = options.includeInternal && Boolean(token)
    const cacheKey = getEventCacheKey(eventId, includeInternal, options.language)

    try {
        const event = await fetchEventDetail(eventId, options, signal)
        await writeCachedValue(cacheKey, event)
        return event
    } catch (error) {
        const cachedEvent = await readCachedValue<KvarteretEventDocument>(
            cacheKey,
            EVENTS_CACHE_TTL_MS,
        )

        if (cachedEvent) {
            return cachedEvent
        }

        throw error
    }
}

export { pickHomeEvents, selectEventTranslation }
