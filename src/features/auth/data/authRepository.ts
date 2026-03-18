import { ZodError } from "zod"
import { getStoredJson, removeStoredValue, setStoredJson } from "@/core/storage/asyncStorage"
import {
    getSessionValue,
    removeSessionValue,
    SESSION_STORAGE_KEYS,
    setSessionValue,
} from "@/core/storage/sessionStorage"
import { createAuthServiceError, toAuthServiceError } from "@/features/auth/domain/authError"
import {
    mobileCardSessionRequestSchema,
    parseMobileCardSession,
    parseInternkortInformation,
} from "@/features/auth/domain/internkortSchema"
import { User } from "@/shared/types/user"

const DEFAULT_INTERNKORT_BASE_URL = "https://personal.kvarteret.no/api/v1/mobile-card"
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

const getAuthJson = async (path: string, sessionToken: string): Promise<Response> => {
    return fetch(`${getInternkortBaseUrl()}/${path}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
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
        aktiveVerv: Array.isArray(candidate.aktiveVerv)
            ? candidate.aktiveVerv
                  .filter(
                      (entry): entry is User["aktiveVerv"][number] =>
                          Boolean(entry) && typeof entry === "object",
                  )
                  .map(entry => ({
                      navn: typeof entry.navn === "string" ? entry.navn : "",
                      gruppe: typeof entry.gruppe === "string" ? entry.gruppe : "",
                      signertKontrakt: Boolean(entry.signertKontrakt),
                      rabattTrinn:
                          typeof entry.rabattTrinn === "number" &&
                          Number.isInteger(entry.rabattTrinn)
                              ? entry.rabattTrinn
                              : null,
                      pingvinPoeng:
                          typeof entry.pingvinPoeng === "number" &&
                          Number.isInteger(entry.pingvinPoeng)
                              ? entry.pingvinPoeng
                              : 0,
                  }))
            : [],
        dagensOrd: typeof candidate.dagensOrd === "string" ? candidate.dagensOrd : "",
    }
}

const readResponseMessage = async (response: Response): Promise<string> => {
    try {
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
        if (contentType.includes("application/json")) {
            const payload = (await response.json()) as unknown
            if (payload && typeof payload === "object") {
                const detail = (payload as { detail?: unknown }).detail
                if (typeof detail === "string" && detail.trim().length > 0) {
                    return detail.trim()
                }

                const message = (payload as { message?: unknown }).message
                if (typeof message === "string" && message.trim().length > 0) {
                    return message.trim()
                }
            }
            return ""
        }

        return (await response.text()).trim()
    } catch {
        return ""
    }
}

export const requestAccessToken = async (email: string): Promise<boolean> => {
    const requestBody = { email: mobileCardSessionRequestSchema.parse({ email }).email }

    let response: Response
    try {
        response = await postAuthJson("access-codes", requestBody)
    } catch (error) {
        throw createAuthServiceError({
            code: "NETWORK_ERROR",
            message: "Network error. Please check your connection and try again.",
            cause: error,
        })
    }

    if (response.status === 200 || response.status === 202) {
        return true
    }

    const responseText = await readResponseMessage(response)

    if (response.status >= 500) {
        throw createAuthServiceError({
            code: "SERVER_ERROR",
            message: "The server could not send a code right now. Please try again later.",
            status: response.status,
        })
    }

    if (responseText) {
        throw createAuthServiceError({
            code: "REQUEST_FAILED",
            message: responseText,
            status: response.status,
        })
    }

    throw createAuthServiceError({
        code: "REQUEST_FAILED",
        message: `Failed to request access token: ${response.status}`,
        status: response.status,
    })
}

export const createMobileCardSession = async (
    email: string,
    accessToken: string,
): Promise<{
    sessionToken: string
    user: User
}> => {
    const requestBody = mobileCardSessionRequestSchema.parse({ email, accessCode: accessToken })

    let response: Response
    try {
        response = await postAuthJson("sessions", {
            email: requestBody.email,
            access_code: requestBody.accessCode,
        })
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
            return parseMobileCardSession(payload)
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

    if (response.status === 401) {
        throw createAuthServiceError({
            code: "INVALID_AUTH",
            message: "Invalid email or access code.",
            status: response.status,
        })
    }

    const responseText = await readResponseMessage(response)

    if (response.status === 429 && responseText) {
        throw createAuthServiceError({
            code: "REQUEST_FAILED",
            message: responseText,
            status: response.status,
        })
    }

    throw createAuthServiceError({
        code: response.status >= 500 ? "SERVER_ERROR" : "REQUEST_FAILED",
        message: responseText || `Failed to create session: ${response.status}`,
        status: response.status,
    })
}

export const getInternkortInformation = async (sessionToken: string): Promise<User> => {
    let response: Response
    try {
        response = await getAuthJson("me", sessionToken)
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

    if (response.status === 401) {
        throw createAuthServiceError({
            code: "INVALID_AUTH",
            message: "Session expired. Please sign in again.",
            status: response.status,
        })
    }

    const responseText = await readResponseMessage(response)
    throw createAuthServiceError({
        code: response.status >= 500 ? "SERVER_ERROR" : "REQUEST_FAILED",
        message: responseText || `Failed to fetch user information: ${response.status}`,
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
