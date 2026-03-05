import { ZodError } from "zod"
import {
    getSessionValue,
    removeSessionValue,
    SESSION_STORAGE_KEYS,
    setSessionValue,
} from "@/core/storage/sessionStorage"
import { getStoredJson, removeStoredValue, setStoredJson } from "@/core/storage/asyncStorage"
import { createAuthServiceError, toAuthServiceError } from "@/features/auth/domain/authError"
import {
    digitalInternKortRequestSchema,
    parseInternkortInformation,
} from "@/features/auth/domain/internkortSchema"
import { User } from "@/shared/types/user"

const DEFAULT_INTERNKORT_BASE_URL = "https://api.kvarteret.no/api/DigitalInternkort"
const SESSION_CACHE_USER_KEY = "session_cached_user"

export interface AuthResult {
    success: boolean
    message?: string
    status?: number
}

const getInternkortBaseUrl = (): string => {
    const configured = process.env.EXPO_PUBLIC_INTERNKORT_BASE_URL?.trim()
    const base = configured && configured.length > 0 ? configured : DEFAULT_INTERNKORT_BASE_URL
    return base.endsWith("/") ? base.slice(0, -1) : base
}

const postAuthJson = async (path: string, body: Record<string, unknown>): Promise<Response> => {
    return fetch(`${getInternkortBaseUrl()}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

const mapCachedUser = (payload: unknown): User | null => {
    if (!payload || typeof payload !== "object") {
        return null
    }

    const candidate = payload as Partial<User> & Record<string, unknown>
    if (typeof candidate.id !== "number") {
        return null
    }

    const gyldigTilRaw = candidate.gyldigTil
    const gyldigTil = new Date(
        gyldigTilRaw instanceof Date ? gyldigTilRaw.getTime() : String(gyldigTilRaw ?? ""),
    )
    if (Number.isNaN(gyldigTil.getTime())) {
        return null
    }

    const toOptionalDate = (raw: unknown): Date | null => {
        if (!raw) {
            return null
        }

        const parsed = new Date(raw instanceof Date ? raw.getTime() : String(raw))
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    return {
        id: candidate.id,
        fornavn: typeof candidate.fornavn === "string" ? candidate.fornavn : "",
        etternavn: typeof candidate.etternavn === "string" ? candidate.etternavn : "",
        fodselsdato: toOptionalDate(candidate.fodselsdato),
        opprettet: toOptionalDate(candidate.opprettet),
        gyldigTil,
        bildeUrl: typeof candidate.bildeUrl === "string" ? candidate.bildeUrl : undefined,
        pingvinPoengSum:
            typeof candidate.pingvinPoengSum === "number" ? candidate.pingvinPoengSum : 0,
        aktiveVerv: Array.isArray(candidate.aktiveVerv) ? (candidate.aktiveVerv as User["aktiveVerv"]) : [],
        dagensOrd: typeof candidate.dagensOrd === "string" ? candidate.dagensOrd : "",
    }
}

const isInvalidAccessTokenResponse = (status: number, bodyText: string): boolean => {
    if (status === 401 || status === 404) {
        return true
    }

    if (status !== 400) {
        return false
    }

    const normalized = bodyText.toLowerCase()
    return normalized.includes("access token") || normalized.includes("accesstoken")
}

export const requestAccessToken = async (email: string): Promise<boolean> => {
    const requestBody = digitalInternKortRequestSchema.parse({ email })

    let response: Response
    try {
        response = await postAuthJson("RequestAccessTokenOnEmail", requestBody)
    } catch (error) {
        throw createAuthServiceError({
            code: "NETWORK_ERROR",
            message: "Network error. Please check your connection and try again.",
            cause: error,
        })
    }

    if (response.status === 200) {
        return true
    }

    if (response.status === 404) {
        throw createAuthServiceError({
            code: "EMAIL_NOT_FOUND",
            message: "Email not found in the database",
            status: 404,
        })
    }

    throw createAuthServiceError({
        code: "REQUEST_FAILED",
        message: `Failed to request access token: ${response.status}`,
        status: response.status,
    })
}

export const getInternkortInformation = async (
    email: string,
    accessToken: string,
): Promise<User> => {
    const requestBody = digitalInternKortRequestSchema.parse({ email, accessToken })

    let response: Response
    try {
        response = await postAuthJson("GetInternkortInformation", requestBody)
    } catch (error) {
        throw createAuthServiceError({
            code: "NETWORK_ERROR",
            message: "Network error. Please check your connection and try again.",
            cause: error,
        })
    }

    if (response.status === 200) {
        let payload: unknown

        try {
            payload = await response.json()
        } catch (error) {
            throw createAuthServiceError({
                code: "UNEXPECTED_RESPONSE",
                message: "Server returned an unreadable response.",
                status: response.status,
                cause: error,
            })
        }

        try {
            return parseInternkortInformation(payload)
        } catch (error) {
            if (error instanceof ZodError) {
                throw createAuthServiceError({
                    code: "UNEXPECTED_RESPONSE",
                    message: "Server response format was invalid.",
                    status: response.status,
                    cause: error,
                })
            }

            throw createAuthServiceError({
                code: "UNEXPECTED_RESPONSE",
                message: "Could not parse server response.",
                status: response.status,
                cause: error,
            })
        }
    }

    let responseText = ""
    try {
        responseText = await response.text()
    } catch {
        responseText = ""
    }

    if (isInvalidAccessTokenResponse(response.status, responseText)) {
        throw createAuthServiceError({
            code: "INVALID_AUTH",
            message:
                response.status === 404
                    ? "User not found"
                    : "Invalid or expired access token",
            status: response.status,
        })
    }

    throw createAuthServiceError({
        code: "REQUEST_FAILED",
        message: `Failed to fetch user information: ${response.status}`,
        status: response.status,
    })
}

export const saveCredentials = async (email: string, accessToken: string): Promise<void> => {
    await setSessionValue(SESSION_STORAGE_KEYS.email, email)
    await setSessionValue(SESSION_STORAGE_KEYS.accessToken, accessToken)
}

export const getSavedCredentials = async (): Promise<{
    email: string | null
    accessToken: string | null
}> => {
    const [email, accessToken] = await Promise.all([
        getSessionValue(SESSION_STORAGE_KEYS.email),
        getSessionValue(SESSION_STORAGE_KEYS.accessToken),
    ])

    return { email, accessToken }
}

export const clearCredentials = async (): Promise<void> => {
    await Promise.all([
        removeSessionValue(SESSION_STORAGE_KEYS.email),
        removeSessionValue(SESSION_STORAGE_KEYS.accessToken),
    ])
}

export const saveCachedUser = async (user: User): Promise<void> => {
    await setStoredJson(SESSION_CACHE_USER_KEY, user)
}

export const getCachedUser = async (): Promise<User | null> => {
    const cached = await getStoredJson<unknown>(SESSION_CACHE_USER_KEY)
    return mapCachedUser(cached)
}

export const clearCachedUser = async (): Promise<void> => {
    await removeStoredValue(SESSION_CACHE_USER_KEY)
}

export const saveDeepLinkToken = async (token: string): Promise<void> => {
    await setSessionValue(SESSION_STORAGE_KEYS.deepLinkToken, token)
}

export const clearDeepLinkToken = async (): Promise<void> => {
    await removeSessionValue(SESSION_STORAGE_KEYS.deepLinkToken)
}

export const authResultFromError = (error: unknown): AuthResult => {
    const authError = toAuthServiceError(error)
    return {
        success: false,
        message: authError.message,
        status: authError.status,
    }
}

export const extractFriendlyErrorMessage = (error: unknown): string =>
    toAuthServiceError(error).message
