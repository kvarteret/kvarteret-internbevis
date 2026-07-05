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

    it("posts feedback as JSON to the personal backend", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })

        await submitFeedback({
            contactAllowed: true,
            contactEmail: "test@example.com",
            message: "Hei fra test",
            page: "/(tabs)/feedback",
            platform: "ios",
            user: { id: 7, fullName: "Test Person" },
        })

        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
            "https://personal.kvarteret.no/api/v1/feedback",
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
            }),
        )

        const [, options] = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(String(options.body))

        expect(body.message).toBe("Hei fra test")
        expect(body.platform).toBe("ios")
        expect(body.contact_allowed).toBe(true)
        expect(body.contact_email).toBe("test@example.com")
        expect(body.user_id).toBe(7)
        expect(body.user_full_name).toBe("Test Person")
    })

    it("omits contact email when contact is not allowed", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })

        await submitFeedback({
            contactAllowed: false,
            contactEmail: "test@example.com",
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "android",
        })

        const [, options] = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(String(options.body))

        expect(body.contact_allowed).toBe(false)
        expect(body.contact_email).toBeNull()
    })

    it("throws when the backend returns a non-2xx status", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei",
                page: "/(tabs)/feedback",
                platform: "android",
            }),
        ).rejects.toThrow("Feedback submission failed with status 500.")
    })

    it("surfaces network failures", async () => {
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"))

        await expect(
            submitFeedback({
                contactAllowed: false,
                message: "Hei",
                page: "/(tabs)/feedback",
                platform: "ios",
            }),
        ).rejects.toThrow("Network down")
    })
})
