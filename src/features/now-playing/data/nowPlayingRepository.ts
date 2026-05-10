import { appEnv } from "@/app/config/env"

export interface NowPlayingState {
    authorized: boolean
    hasTrack: boolean
    isPlaybackActive: boolean
    name: string | null
    artists: string | null
    album: string | null
    image: string | null
    progressMs: number | null
    durationMs: number | null
    progressPercent: number | null
    connectUrl: string
}

const MOBILE_CARD_API_PREFIXES = ["/api/v1/mobile-card", "/api/DigitalInternkort"] as const

const getPersonalBaseUrl = (): string => {
    const configured = appEnv.internkortBaseUrl.trim()
    const base = configured.endsWith("/") ? configured.slice(0, -1) : configured

    for (const prefix of MOBILE_CARD_API_PREFIXES) {
        if (base.endsWith(prefix)) {
            return base.slice(0, -prefix.length)
        }
    }

    return base
}

const getSpotifyConnectUrl = (connectUrl?: string | null): string => {
    const trimmed = typeof connectUrl === "string" ? connectUrl.trim() : ""
    if (trimmed.length > 0) {
        return trimmed
    }

    return `${getPersonalBaseUrl()}/login`
}

const parseRequiredBoolean = (value: unknown, field: string): boolean => {
    if (typeof value !== "boolean") {
        throw new Error(`Invalid now playing response: ${field} must be a boolean`)
    }

    return value
}

const parseNullableString = (value: unknown): string | null => {
    if (value === null || value === undefined) {
        return null
    }

    return typeof value === "string" ? value : null
}

const parseNullableNumber = (value: unknown, field: string): number | null => {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return value
    }

    throw new Error(`Invalid now playing response: ${field} must be a number or null`)
}

const parseNowPlayingResponse = (payload: unknown): NowPlayingState => {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid now playing response payload")
    }

    const value = payload as Record<string, unknown>

    return {
        authorized: parseRequiredBoolean(value.authorized, "authorized"),
        hasTrack: parseRequiredBoolean(value.hasTrack, "hasTrack"),
        isPlaybackActive: parseRequiredBoolean(value.isPlaybackActive, "isPlaybackActive"),
        name: parseNullableString(value.name),
        artists: parseNullableString(value.artists),
        album: parseNullableString(value.album),
        image: parseNullableString(value.image),
        progressMs: parseNullableNumber(value.progressMs, "progressMs"),
        durationMs: parseNullableNumber(value.durationMs, "durationMs"),
        progressPercent: parseNullableNumber(value.progressPercent, "progressPercent"),
        connectUrl: getSpotifyConnectUrl(parseNullableString(value.connectUrl)),
    }
}

export const fetchNowPlaying = async (signal?: AbortSignal): Promise<NowPlayingState> => {
    const response = await fetch(`${getPersonalBaseUrl()}/api/now-playing`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        signal,
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch now playing data (${response.status})`)
    }

    const payload = (await response.json()) as unknown
    return parseNowPlayingResponse(payload)
}
