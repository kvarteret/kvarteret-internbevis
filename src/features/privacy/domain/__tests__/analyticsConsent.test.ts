import {
    hasSeenCurrentAnalyticsPrompt,
    resolveCurrentAnalyticsConsentStatus,
    shouldShowAnalyticsConsentPrompt,
} from "@/features/privacy/domain/analyticsConsent"
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

describe("analyticsConsent", () => {
    it("treats only current-policy records as valid analytics consent", () => {
        expect(
            resolveCurrentAnalyticsConsentStatus({
                status: "granted",
                policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
                source: "kvarteret_prompt",
                timestamp: "2026-04-17T12:00:00.000Z",
            }),
        ).toBe("granted")

        expect(
            resolveCurrentAnalyticsConsentStatus({
                status: "declined",
                policyVersion: "2026-02-01",
                source: "kvarteret_prompt",
                timestamp: "2026-04-17T12:00:00.000Z",
            }),
        ).toBeNull()
    })

    it("tracks whether the analytics prompt has already been shown for the current policy", () => {
        expect(
            hasSeenCurrentAnalyticsPrompt({
                policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
                source: "kvarteret_prompt",
                timestamp: "2026-04-17T12:00:00.000Z",
            }),
        ).toBe(true)

        expect(
            hasSeenCurrentAnalyticsPrompt({
                policyVersion: "2026-02-01",
                source: "kvarteret_prompt",
                timestamp: "2026-04-17T12:00:00.000Z",
            }),
        ).toBe(false)
    })

    it("shows the analytics prompt only after the privacy notice has been acknowledged", () => {
        expect(
            shouldShowAnalyticsConsentPrompt({
                hasAcknowledgedCurrentPolicy: false,
                analyticsConsentStatus: null,
                hasSeenAnalyticsPromptCurrentVersion: false,
            }),
        ).toBe(false)

        expect(
            shouldShowAnalyticsConsentPrompt({
                hasAcknowledgedCurrentPolicy: true,
                analyticsConsentStatus: null,
                hasSeenAnalyticsPromptCurrentVersion: false,
            }),
        ).toBe(true)
    })

    it("does not show the analytics prompt once a choice exists or the current prompt has been seen", () => {
        expect(
            shouldShowAnalyticsConsentPrompt({
                hasAcknowledgedCurrentPolicy: true,
                analyticsConsentStatus: null,
                hasSeenAnalyticsPromptCurrentVersion: true,
            }),
        ).toBe(false)

        expect(
            shouldShowAnalyticsConsentPrompt({
                hasAcknowledgedCurrentPolicy: true,
                analyticsConsentStatus: "granted",
                hasSeenAnalyticsPromptCurrentVersion: false,
            }),
        ).toBe(false)

        expect(
            shouldShowAnalyticsConsentPrompt({
                hasAcknowledgedCurrentPolicy: true,
                analyticsConsentStatus: "declined",
                hasSeenAnalyticsPromptCurrentVersion: false,
            }),
        ).toBe(false)
    })
})
