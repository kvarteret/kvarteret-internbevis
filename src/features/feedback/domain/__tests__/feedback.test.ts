import {
    buildFeedbackPayload,
    FeedbackValidationError,
    MAX_FEEDBACK_MESSAGE_LENGTH,
    normalizeFeedbackMessage,
} from "@/features/feedback/domain/feedback"

describe("feedback validation", () => {
    it("rejects empty or whitespace-only messages", () => {
        expect(() => normalizeFeedbackMessage("   \n  ")).toThrow(FeedbackValidationError)
    })

    it("rejects messages longer than 2000 characters", () => {
        expect(() => normalizeFeedbackMessage("a".repeat(MAX_FEEDBACK_MESSAGE_LENGTH + 1))).toThrow(
            FeedbackValidationError,
        )
    })

    it("trims valid messages", () => {
        expect(normalizeFeedbackMessage("  hei på deg  ")).toBe("hei på deg")
    })
})

describe("buildFeedbackPayload", () => {
    it("omits user metadata for anonymous submissions", () => {
        const payload = buildFeedbackPayload({
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "ios",
            submittedAt: "28.03.2026 12:00",
            user: null,
        })

        const fields = payload.blocks[1].type === "section" ? (payload.blocks[1].fields ?? []) : []

        expect(fields).toHaveLength(4)
        expect(fields.some(field => field.text.includes("Bruker-ID"))).toBe(false)
    })

    it("includes logged-in user metadata", () => {
        const payload = buildFeedbackPayload({
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "android",
            submittedAt: "28.03.2026 12:00",
            user: {
                id: 12,
                fullName: "Sample Person",
            },
        })

        const fields = payload.blocks[1].type === "section" ? (payload.blocks[1].fields ?? []) : []

        expect(fields.some(field => field.text.includes("Sample Person"))).toBe(true)
        expect(fields.some(field => field.text.includes("12"))).toBe(true)
    })

    it("escapes slack special characters in the message", () => {
        const payload = buildFeedbackPayload({
            message: "Hei <team> & takk",
            page: "/(tabs)/feedback",
            platform: "ios",
            submittedAt: "28.03.2026 12:00",
            user: null,
        })

        const messageSection =
            payload.blocks[payload.blocks.length - 1].type === "section"
                ? payload.blocks[payload.blocks.length - 1].text?.text
                : ""

        expect(messageSection).toContain("&lt;team&gt;")
        expect(messageSection).toContain("&amp;")
    })
})
