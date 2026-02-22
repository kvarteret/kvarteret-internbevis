import {
    extractAccessTokenFromDeepLinkValue,
    isLikelyRawAccessToken,
    normalizeExternalUrl,
} from "@/core/linking/linkClient"

describe("linkingService", () => {
    it("extracts access token from query param", () => {
        const token = extractAccessTokenFromDeepLinkValue(
            "https://kvarteret.no/login?accessToken=abc123",
        )
        expect(token).toBe("abc123")
    })

    it("extracts and decodes access token from hash fragment", () => {
        const token = extractAccessTokenFromDeepLinkValue("#accessToken=abc%2B123")
        expect(token).toBe("abc+123")
    })

    it("normalizes host-only external urls", () => {
        const normalized = normalizeExternalUrl("open.spotify.com/artist/123")
        expect(normalized).toBe("https://open.spotify.com/artist/123")
    })

    it("recognizes likely raw token values", () => {
        expect(isLikelyRawAccessToken("raw-token-123")).toBe(true)
        expect(isLikelyRawAccessToken("hello world")).toBe(false)
    })
})
