import {
    buildFeedbackRequestBody,
    FEEDBACK_SOURCE,
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

describe("buildFeedbackRequestBody", () => {
    it("builds the anonymous API contract without unverified identity fields", () => {
        const body = buildFeedbackRequestBody({
            contactAllowed: false,
            contactEmail: null,
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "ios",
        })

        expect(body).toEqual({
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "ios",
            contact_allowed: false,
            contact_email: null,
            source: FEEDBACK_SOURCE,
        })
    })

    it("includes the contact email when allowed", () => {
        const body = buildFeedbackRequestBody({
            contactAllowed: true,
            contactEmail: "sample.person@example.com",
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "android",
        })

        expect(body.contact_allowed).toBe(true)
        expect(body.contact_email).toBe("sample.person@example.com")
        expect(body).not.toHaveProperty("user_id")
        expect(body).not.toHaveProperty("user_full_name")
    })

    it("omits the contact email when contact is not allowed, even if one was typed", () => {
        const body = buildFeedbackRequestBody({
            contactAllowed: false,
            contactEmail: "sample.person@example.com",
            message: "Hei",
            page: "/(tabs)/feedback",
            platform: "ios",
        })

        expect(body.contact_email).toBeNull()
    })

    it("falls back to the feedback page and unknown platform when blank", () => {
        const body = buildFeedbackRequestBody({
            contactAllowed: false,
            contactEmail: null,
            message: "Hei",
            page: "  ",
            platform: "  ",
        })

        expect(body.page).toBe("/(tabs)/feedback")
        expect(body.platform).toBe("unknown")
    })

    it("rejects an invalid contact email even when validating the full submission", () => {
        expect(() =>
            buildFeedbackRequestBody({
                contactAllowed: true,
                contactEmail: "ikke-en-epost",
                message: "Hei",
                page: "/(tabs)/feedback",
                platform: "ios",
            }),
        ).toThrow(FeedbackValidationError)
    })
})
