jest.mock("@/app/config/env", () => ({
    appEnv: {
        kvarteretPersonalApiBaseUrl: "https://personal.kvarteret.no/api/v1",
    },
}))

import { submitFeedback } from "@/features/feedback/data/feedbackRepository"

describe("submitFeedback", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn() as typeof fetch
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it("posts feedback as json to the backend feedback endpoint", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
        })

        await submitFeedback({
            contactAllowed: true,
            contactEmail: "test@example.com",
            message: "Hei fra test",
            page: "/(tabs)/feedback",
            platform: "ios",
        })

        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
            "https://personal.kvarteret.no/api/v1/feedback/",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }),
        )

        const [, options] = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(String(options.body)) as {
            message: string
            source: string
            contact_email: string | null
        }

        expect(body.message).toBe("Hei fra test")
        expect(body.source).toBe("internbevis-rn")
        expect(body.contact_email).toBe("test@example.com")
        expect(body).not.toHaveProperty("user_id")
        expect(body).not.toHaveProperty("user_full_name")
    })

    it("throws when the endpoint returns a non-2xx status", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
        })

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei fra test",
                page: "/(tabs)/feedback",
                platform: "android",
            }),
        ).rejects.toThrow("Feedback request failed with status 500.")
    })

    it("throws a rate-limit-specific error on 429", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 429,
        })

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei fra test",
                page: "/(tabs)/feedback",
                platform: "android",
            }),
        ).rejects.toThrow("Too many feedback submissions")
    })

    it("throws when the backend responds ok:false", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ ok: false, detail: "Du må skrive noe først." }),
        })

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei fra test",
                page: "/(tabs)/feedback",
                platform: "android",
            }),
        ).rejects.toThrow("Du må skrive noe først.")
    })

    it("rejects a malformed success payload at the network boundary", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ detail: "missing ok" }),
        })

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei fra test",
                page: "/(tabs)/feedback",
                platform: "android",
            }),
        ).rejects.toThrow()
    })

    it("surfaces network failures", async () => {
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"))

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei fra test",
                page: "/(tabs)/feedback",
                platform: "ios",
            }),
        ).rejects.toThrow("Network down")
    })
})
