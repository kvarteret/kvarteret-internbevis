import { Linking } from "react-native"

const ACCESS_TOKEN_PATTERN = /(?:[?&#]|^)accessToken=([^&#]+)/
const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/

const safeDecode = (value: string): string => {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

export const extractAccessTokenFromDeepLinkValue = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) {
        return null
    }

    const tokenMatch = trimmed.match(ACCESS_TOKEN_PATTERN)
    if (!tokenMatch?.[1]) {
        return null
    }

    return safeDecode(tokenMatch[1])
}

export const isLikelyRawAccessToken = (value: string): boolean =>
    !value.includes("://") && !value.includes(" ") && !value.includes("=")

export const normalizeExternalUrl = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) {
        return null
    }

    if (URL_SCHEME_PATTERN.test(trimmed)) {
        return trimmed
    }

    return `https://${trimmed}`
}

export const openExternalUrl = async (rawUrl: string | null | undefined): Promise<boolean> => {
    if (!rawUrl) {
        return false
    }

    const normalizedUrl = normalizeExternalUrl(rawUrl)
    if (!normalizedUrl) {
        return false
    }

    try {
        const canOpen = await Linking.canOpenURL(normalizedUrl)
        if (!canOpen) {
            return false
        }

        await Linking.openURL(normalizedUrl)
        return true
    } catch {
        return false
    }
}
