import {
    isCurrentPrivacyPolicyAcknowledged,
    shouldShowPrivacyNoticeDialog,
} from "@/features/privacy/domain/privacyConsent"
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

describe("privacyConsent", () => {
    it("treats the current version as acknowledged only when it matches exactly", () => {
        expect(isCurrentPrivacyPolicyAcknowledged(CURRENT_PRIVACY_POLICY_VERSION)).toBe(true)
        expect(isCurrentPrivacyPolicyAcknowledged("2026-02-01")).toBe(false)
        expect(isCurrentPrivacyPolicyAcknowledged(null)).toBe(false)
    })

    it("shows the privacy notice dialog when the current policy has not been acknowledged", () => {
        expect(
            shouldShowPrivacyNoticeDialog({
                firstSegment: undefined,
                hasAcknowledgedCurrentPolicy: false,
            }),
        ).toBe(false)

        expect(
            shouldShowPrivacyNoticeDialog({
                firstSegment: "login",
                hasAcknowledgedCurrentPolicy: false,
            }),
        ).toBe(true)
    })

    it("does not show the privacy notice dialog while reading the privacy screen", () => {
        expect(
            shouldShowPrivacyNoticeDialog({
                firstSegment: "privacy",
                hasAcknowledgedCurrentPolicy: false,
            }),
        ).toBe(false)
    })

    it("does not show the privacy notice dialog once the current policy has been acknowledged", () => {
        expect(
            shouldShowPrivacyNoticeDialog({
                firstSegment: "(tabs)",
                hasAcknowledgedCurrentPolicy: true,
            }),
        ).toBe(false)

        expect(
            shouldShowPrivacyNoticeDialog({
                firstSegment: "login",
                hasAcknowledgedCurrentPolicy: true,
            }),
        ).toBe(false)
    })
})
