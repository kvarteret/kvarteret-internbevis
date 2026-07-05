import {
    FeedbackValidationError,
    MAX_FEEDBACK_MESSAGE_LENGTH,
    normalizeFeedbackContactEmail,
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

    it("accepts an empty contact email", () => {
        expect(normalizeFeedbackContactEmail("   ")).toBeNull()
    })

    it("rejects an invalid contact email", () => {
        expect(() => normalizeFeedbackContactEmail("ikke-en-epost")).toThrow(
            FeedbackValidationError,
        )
    })
})
