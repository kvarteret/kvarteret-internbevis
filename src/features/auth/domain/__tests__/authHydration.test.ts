import { createAuthServiceError } from "../authError"
import { shouldClearCredentialsOnHydrationError } from "../authHydration"

describe("shouldClearCredentialsOnHydrationError", () => {
    it("returns true for invalid auth errors", () => {
        const error = createAuthServiceError({
            code: "INVALID_AUTH",
            message: "Invalid or expired access token",
            status: 401,
        })

        expect(shouldClearCredentialsOnHydrationError(error)).toBe(true)
    })

    it("returns false for transient network errors", () => {
        const error = createAuthServiceError({
            code: "NETWORK_ERROR",
            message: "Network error",
        })

        expect(shouldClearCredentialsOnHydrationError(error)).toBe(false)
    })

    it("returns false for unexpected response errors", () => {
        const error = createAuthServiceError({
            code: "UNEXPECTED_RESPONSE",
            message: "Server response format was invalid.",
            status: 200,
        })

        expect(shouldClearCredentialsOnHydrationError(error)).toBe(false)
    })

    it("returns false for unknown errors", () => {
        expect(shouldClearCredentialsOnHydrationError(new Error("boom"))).toBe(false)
    })
})
