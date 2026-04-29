jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    removeStoredValue: jest.fn(),
    setStoredJson: jest.fn(),
}))

jest.mock("@/core/storage/sessionStorage", () => ({
    SESSION_STORAGE_KEYS: {
        email: "email",
        accessToken: "accessToken",
        deepLinkToken: "deep_link_token",
    },
    getSessionValue: jest.fn(),
    removeSessionValue: jest.fn(),
    setSessionValue: jest.fn(),
}))

import { setSessionValue } from "@/core/storage/sessionStorage"
import {
    createMobileCardSession,
    getInternkortInformation,
} from "@/features/auth/data/authRepository"

describe("getInternkortInformation", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn() as typeof fetch
        jest.clearAllMocks()
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it("persists a renewed session token from the response header", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            headers: {
                get: (name: string) =>
                    name.toLowerCase() === "x-mobile-card-session-token"
                        ? "renewed-token-456"
                        : null,
            },
            json: async () => ({
                person_id: 12,
                first_name: "Ada",
                last_name: "Lovelace",
                birth_date: null,
                created_at: "2026-03-01T12:00:00Z",
                valid_until: "2026-06-01T12:00:00Z",
                photo_url: null,
                pingvin_points: 8,
                active_roles: [],
                word_of_the_day: "pingvin",
            }),
            status: 200,
        })

        const user = await getInternkortInformation("token-123")

        expect(user.id).toBe(12)
        expect(global.fetch).toHaveBeenCalledWith(
            "https://personal.kvarteret.no/api/v1/mobile-card/me?include_role_history=true",
            expect.any(Object),
        )
        expect(setSessionValue).toHaveBeenCalledWith("accessToken", "renewed-token-456")
    })

    it("requests role history when creating a mobile-card session", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            headers: {
                get: () => null,
            },
            json: async () => ({
                session_token: "session-123",
                card: {
                    person_id: 12,
                    first_name: "Ada",
                    last_name: "Lovelace",
                    birth_date: null,
                    created_at: "2026-03-01T12:00:00Z",
                    valid_until: "2026-06-01T12:00:00Z",
                    photo_url: null,
                    pingvin_points: 8,
                    active_roles: [],
                    word_of_the_day: "pingvin",
                },
            }),
            status: 200,
        })

        const session = await createMobileCardSession("ada@example.com", "123456")

        expect(session.sessionToken).toBe("session-123")
        expect(global.fetch).toHaveBeenCalledWith(
            "https://personal.kvarteret.no/api/v1/mobile-card/sessions?include_role_history=true",
            expect.any(Object),
        )
    })

    it("does not rewrite the token when the response header is absent", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            headers: {
                get: () => null,
            },
            json: async () => ({
                person_id: 12,
                first_name: "Ada",
                last_name: "Lovelace",
                birth_date: null,
                created_at: "2026-03-01T12:00:00Z",
                valid_until: "2026-06-01T12:00:00Z",
                photo_url: null,
                pingvin_points: 8,
                active_roles: [],
                word_of_the_day: "pingvin",
            }),
            status: 200,
        })

        await getInternkortInformation("token-123")

        expect(setSessionValue).not.toHaveBeenCalled()
    })
})
