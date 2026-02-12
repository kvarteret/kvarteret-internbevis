import * as Linking from "expo-linking"

function extractTokenFromDeepLink(value: string): string | null {
    if (!value) {
        return null
    }

    let token: unknown = null

    try {
        const parsed = Linking.parse(value)
        token = parsed.queryParams?.accessToken
    } catch {
        token = null
    }

    if (!token) {
        try {
            const parsedUrl = new URL(value)
            token = parsedUrl.searchParams.get("accessToken")
        } catch {
            token = null
        }
    }

    if (!token && value.includes("accessToken=")) {
        const [, queryPart] = value.split("accessToken=")
        token = queryPart?.split("&")[0]
    }

    if (typeof token === "string" && token.length > 0) {
        try {
            return decodeURIComponent(token)
        } catch {
            return token
        }
    }

    return null
}

function looksLikeRawToken(value: string): boolean {
    return !value.includes("://") && !value.includes(" ") && !value.includes("=")
}

export function extractAccessTokenFromUrl(url: string): string | null {
    const trimmed = url.trim()
    if (!trimmed) {
        return null
    }

    return extractTokenFromDeepLink(trimmed)
}

export function extractAccessTokenFromManualInput(input: string): string | null {
    const trimmed = input.trim()
    if (!trimmed) {
        return null
    }

    const tokenFromUrl = extractTokenFromDeepLink(trimmed)
    if (tokenFromUrl) {
        return tokenFromUrl
    }

    if (looksLikeRawToken(trimmed)) {
        return trimmed
    }

    return null
}
