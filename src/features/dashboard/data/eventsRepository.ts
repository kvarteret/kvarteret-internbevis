import { appEnv } from "@/app/config/env"
import {
    type ListEventsData,
    listEvents,
    type PublicEventsResponse,
} from "@/core/api/samfunnet-events"
import { client } from "@/core/api/samfunnet-events/client.gen"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import type { EventOccurrence } from "@/features/dashboard/domain/types"

const EVENTS_CACHE_KEY_PREFIX = "samfunnet_events_api_cache:v1"
const EVENTS_CACHE_TTL_MS = 15 * 60 * 1000

interface CachedPayload<T> {
    cachedAt: number
    etag?: string
    value: T
}

type EventLanguage = "no" | "en"

const toApiLocale = (language: EventLanguage): "nb" | "en" => (language === "en" ? "en" : "nb")

const toOsloDateString = (): string =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())

const configureClient = (): void => {
    client.setConfig({ baseUrl: appEnv.samfunnetApiBaseUrl.replace(/\/$/, "") })
}

const getEventsCacheKey = (
    locale: "nb" | "en",
    from: string,
    to: string | undefined,
    includeInternal: boolean,
): string =>
    `${EVENTS_CACHE_KEY_PREFIX}:${includeInternal ? "internal" : "public"}:${locale}:${from}:${to ?? "open"}`

const readCachedPayload = async <T>(key: string): Promise<CachedPayload<T> | null> => {
    try {
        return await getStoredJson<CachedPayload<T>>(key)
    } catch {
        return null
    }
}

const isFresh = (payload: CachedPayload<unknown>): boolean =>
    Date.now() - payload.cachedAt <= EVENTS_CACHE_TTL_MS

const writeCachedPayload = async <T>(key: string, value: T, etag?: string): Promise<void> => {
    try {
        await setStoredJson(key, { cachedAt: Date.now(), etag, value })
    } catch {
        // Cache failures must not hide a successful API response.
    }
}

export interface FetchEventsOptions {
    language: EventLanguage
    from?: string
    to?: string
    includeInternal?: boolean
}

// The internal-events flag is intentionally not part of the public OpenAPI
// document. Keep the generated client untouched while allowing the runtime to
// pass the backend extension for authenticated requests.
type EventsQuery = NonNullable<ListEventsData["query"]> & {
    includeInternal?: true
}

export const fetchEventOccurrences = async (
    options: FetchEventsOptions,
    signal?: AbortSignal,
): Promise<PublicEventsResponse> => {
    configureClient()
    const locale = toApiLocale(options.language)
    const from = options.from ?? toOsloDateString()
    const includeInternal = options.includeInternal === true
    const cacheKey = getEventsCacheKey(locale, from, options.to, includeInternal)
    const cached = await readCachedPayload<PublicEventsResponse>(cacheKey)

    try {
        const query: EventsQuery = { locale, from, to: options.to }
        if (includeInternal) query.includeInternal = true

        const result = await listEvents({
            headers: cached?.etag ? { "If-None-Match": cached.etag } : undefined,
            query: query as ListEventsData["query"],
            signal,
        })

        if (result.response?.status === 304 && cached) {
            await writeCachedPayload(cacheKey, cached.value, cached.etag)
            return cached.value
        }
        if (!result.response?.ok || result.error || !result.data) {
            throw new Error(`Unable to fetch events (${result.response?.status ?? "network"}).`)
        }

        const etag = result.response.headers.get("etag") ?? undefined
        await writeCachedPayload(cacheKey, result.data, etag)
        return result.data
    } catch (error) {
        if (cached && isFresh(cached)) return cached.value
        throw error
    }
}

export const fetchHomeEvents = async (
    language: EventLanguage,
    signal?: AbortSignal,
    options?: Pick<FetchEventsOptions, "includeInternal">,
): Promise<EventOccurrence[]> => {
    const response = await fetchEventOccurrences(
        { language, includeInternal: options?.includeInternal },
        signal,
    )
    return response.data
}

export const fetchEventById = async (
    occurrenceId: string,
    language: EventLanguage,
    signal?: AbortSignal,
    options?: Pick<FetchEventsOptions, "includeInternal">,
): Promise<EventOccurrence> => {
    const response = await fetchEventOccurrences(
        { language, includeInternal: options?.includeInternal },
        signal,
    )
    const occurrence = response.data.find(
        candidate => candidate.id === occurrenceId || candidate.event.id === occurrenceId,
    )
    if (!occurrence) throw new Error(`Event occurrence not found: ${occurrenceId}`)
    return occurrence
}
