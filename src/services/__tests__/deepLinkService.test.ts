import { extractAccessTokenFromManualInput, extractAccessTokenFromUrl } from "../deepLinkService"

describe("deepLinkService", () => {
    it("extracts accessToken from URL query string", () => {
        const token = extractAccessTokenFromUrl("https://kvarteret.no/login?accessToken=abc123")
        expect(token).toBe("abc123")
    })

    it("extracts encoded accessToken from URL query string", () => {
        const token = extractAccessTokenFromUrl("https://kvarteret.no/login?accessToken=abc%2B123")
        expect(token).toBe("abc+123")
    })

    it("does not accept raw token in URL parser", () => {
        const token = extractAccessTokenFromUrl("raw-token-123")
        expect(token).toBeNull()
    })

    it("accepts raw token in manual input parser", () => {
        const token = extractAccessTokenFromManualInput("raw-token-123")
        expect(token).toBe("raw-token-123")
    })

    it("returns null for invalid manual input", () => {
        const token = extractAccessTokenFromManualInput("hello world")
        expect(token).toBeNull()
    })
})
