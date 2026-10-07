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

import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { getSessionValue, setSessionValue } from "@/core/storage/sessionStorage"
import {
    cacheAuthenticatedCard,
    createMobileCardSession,
    getCachedUser,
    getInternkortInformation,
    getSavedSessionToken,
    refreshSessionUser,
} from "@/features/auth/data/authRepository"

const cardPayload = {
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
}

const okResponse = (renewedToken: string | null = null) => ({
    headers: {
        get: (name: string) =>
            name.toLowerCase() === "x-mobile-card-session-token" ? renewedToken : null,
    },
    json: async () => cardPayload,
    status: 200,
})

const unauthorizedResponse = () => ({
    headers: { get: () => null },
    status: 401,
})

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
            "https://personal.samfunnetibergen.no/api/v1/mobile-card/me?include_role_history=true",
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
                    future_private_field: "must-not-be-cached",
                },
            }),
            status: 200,
        })

        const session = await createMobileCardSession("ada@example.com", "123456")

        expect(session.sessionToken).toBe("session-123")
        expect(global.fetch).toHaveBeenCalledWith(
            "https://personal.samfunnetibergen.no/api/v1/mobile-card/sessions?include_role_history=true",
            expect.any(Object),
        )
        expect(setStoredJson).not.toHaveBeenCalled()

        await cacheAuthenticatedCard(session.rawCard)

        expect(setStoredJson).toHaveBeenCalledWith(
            "session_cached_user:v2",
            expect.not.objectContaining({ future_private_field: expect.anything() }),
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

    it("caches the raw card payload that passed the schema", async () => {
        const rawCard = {
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
        }
        ;(global.fetch as jest.Mock).mockResolvedValue({
            headers: { get: () => null },
            json: async () => rawCard,
            status: 200,
        })

        await getInternkortInformation("token-123")

        expect(setStoredJson).toHaveBeenCalledWith(
            "session_cached_user:v2",
            expect.objectContaining({ person_id: 12 }),
        )
    })
})

describe("session token resilience", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn() as typeof fetch
        jest.clearAllMocks()
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it("retries a failed renewed-token save", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(okResponse("renewed-token-456"))
        ;(setSessionValue as jest.Mock)
            .mockRejectedValueOnce(new Error("Keystore operation failed"))
            .mockResolvedValueOnce(undefined)

        const user = await getInternkortInformation("token-123")

        expect(user.id).toBe(12)
        expect(setSessionValue).toHaveBeenCalledTimes(2)
        expect(setSessionValue).toHaveBeenLastCalledWith("accessToken", "renewed-token-456")
    })

    it("keeps the session usable when every renewed-token save fails", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(okResponse("renewed-token-456"))
        ;(setSessionValue as jest.Mock).mockRejectedValue(new Error("Keystore operation failed"))

        const user = await getInternkortInformation("token-123")

        expect(user.id).toBe(12)
        expect(setSessionValue).toHaveBeenCalledTimes(3)
    })

    it("retries a failed token read", async () => {
        ;(getSessionValue as jest.Mock)
            .mockRejectedValueOnce(new Error("Keystore operation failed"))
            .mockResolvedValueOnce("token-123")

        expect(await getSavedSessionToken()).toBe("token-123")
    })

    it("reports a storage error when the token stays unreadable", async () => {
        ;(getSessionValue as jest.Mock).mockRejectedValue(new Error("Keystore operation failed"))

        await expect(getSavedSessionToken()).rejects.toMatchObject({ code: "STORAGE_ERROR" })
    })

    it("uses a newer stored token after a 401", async () => {
        ;(global.fetch as jest.Mock)
            .mockResolvedValueOnce(unauthorizedResponse())
            .mockResolvedValueOnce(okResponse())
        ;(getSessionValue as jest.Mock).mockResolvedValue("newer-token")

        const user = await refreshSessionUser("old-token")

        expect(user.id).toBe(12)
        expect((global.fetch as jest.Mock).mock.calls[1][1].headers.Authorization).toBe(
            "Bearer newer-token",
        )
    })

    it("recovers when a second check with the same token succeeds", async () => {
        ;(global.fetch as jest.Mock)
            .mockResolvedValueOnce(unauthorizedResponse())
            .mockResolvedValueOnce(okResponse())
        ;(getSessionValue as jest.Mock).mockResolvedValue("token-123")

        const user = await refreshSessionUser("token-123")

        expect(user.id).toBe(12)
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("rejects the session when the second check also returns 401", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(unauthorizedResponse())
        ;(getSessionValue as jest.Mock).mockResolvedValue("token-123")

        await expect(refreshSessionUser("token-123")).rejects.toMatchObject({
            code: "INVALID_AUTH",
        })
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("does not check again when no token is stored anymore", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(unauthorizedResponse())
        ;(getSessionValue as jest.Mock).mockResolvedValue(null)

        await expect(refreshSessionUser("token-123")).rejects.toMatchObject({
            code: "INVALID_AUTH",
        })
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })
})

describe("getCachedUser", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("rehydrates the cached raw payload through the shared schema parser", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            person_id: 12,
            first_name: "Ada",
            last_name: "Lovelace",
            birth_date: null,
            created_at: "2026-03-01T12:00:00Z",
            valid_until: "2026-06-01T12:00:00Z",
            photo_url: null,
            pingvin_points: 8,
            active_roles: [
                {
                    name: "Utvikler",
                    group: "E-Tjenesten",
                    discount_level: 3,
                    pingvin_points: 2,
                    signed_contract: true,
                },
            ],
            word_of_the_day: "pingvin",
        })

        const user = await getCachedUser()

        expect(user?.id).toBe(12)
        expect(user?.fornavn).toBe("Ada")
        expect(user?.aktiveVerv).toEqual([
            {
                navn: "Utvikler",
                gruppe: "E-Tjenesten",
                rabattTrinn: 3,
                pingvinPoeng: 2,
                signertKontrakt: true,
            },
        ])
    })

    it("treats the legacy mapped-user cache shape as a cache miss", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            id: 12,
            fornavn: "Ada",
            etternavn: "Lovelace",
            gyldigTil: "2026-06-01T12:00:00Z",
            pingvinPoengSum: 8,
            aktiveVerv: [],
            vervHistorikk: [],
            dagensOrd: "pingvin",
        })

        expect(await getCachedUser()).toBeNull()
    })

    it("treats an empty cache as a miss", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue(null)

        expect(await getCachedUser()).toBeNull()
    })
})
