jest.mock("@/app/config/env", () => ({
    appEnv: {
        feedbackWebhookUrl: "https://hooks.slack.com/services/test/test/test",
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

    it("posts feedback as json to the configured webhook", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
        })

        await submitFeedback({
            contactAllowed: true,
            contactEmail: "test@example.com",
            message: "Hei fra test",
            page: "/(tabs)/feedback",
            platform: "ios",
            user: {
                id: 7,
                fullName: "Test Person",
            },
        })

        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
            "https://hooks.slack.com/services/test/test/test",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }),
        )

        const [, options] = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(String(options.body)) as { text: string }

        expect(body.text).toBe("Ny tilbakemelding fra internbevis-rn")
    })

    it("throws when the webhook returns a non-2xx status", async () => {
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
        ).rejects.toThrow("Feedback webhook failed with status 500.")
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
