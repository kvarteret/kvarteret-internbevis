import {
    extractAccessTokenFromDeepLinkValue,
    isLikelyRawAccessToken,
} from "@/core/linking/linkClient"

export const extractAccessTokenFromUrl = (url: string): string | null => {
    const trimmed = url.trim()
    if (!trimmed) {
        return null
    }

    return extractAccessTokenFromDeepLinkValue(trimmed)
}

export const extractAccessTokenFromManualInput = (input: string): string | null => {
    const trimmed = input.trim()
    if (!trimmed) {
        return null
    }

    const tokenFromUrl = extractAccessTokenFromDeepLinkValue(trimmed)
    if (tokenFromUrl) {
        return tokenFromUrl
    }

    if (isLikelyRawAccessToken(trimmed)) {
        return trimmed
    }

    return null
}
