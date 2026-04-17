jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    setStoredJson: jest.fn(),
}))

import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import {
    getCurrentAnalyticsConsentStatus,
    getHasSeenAnalyticsPromptCurrentVersion,
    getStoredAnalyticsConsent,
    getStoredAnalyticsPromptState,
    markAnalyticsPromptSeen,
    setAnalyticsConsent,
} from "@/features/privacy/data/analyticsConsentRepository"
import {
    ANALYTICS_CONSENT_STORAGE_KEY,
    ANALYTICS_PROMPT_STATE_STORAGE_KEY,
    AnalyticsConsentRecord,
} from "@/features/privacy/domain/analyticsConsent"
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

describe("analyticsConsentRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("reads the stored analytics consent record", async () => {
        const record: AnalyticsConsentRecord = {
            status: "granted",
            policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
            source: "kvarteret_prompt",
            timestamp: "2026-04-17T12:00:00.000Z",
        }
        ;(getStoredJson as jest.Mock).mockResolvedValue(record)

        await expect(getStoredAnalyticsConsent()).resolves.toEqual(record)
        expect(getStoredJson).toHaveBeenCalledWith(ANALYTICS_CONSENT_STORAGE_KEY)
    })

    it("returns null when analytics consent is missing or stale", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue(null)
        await expect(getCurrentAnalyticsConsentStatus()).resolves.toBeNull()

        ;(getStoredJson as jest.Mock).mockResolvedValue({
            status: "granted",
            policyVersion: "2026-02-01",
            source: "kvarteret_prompt",
            timestamp: "2026-04-17T12:00:00.000Z",
        })
        await expect(getCurrentAnalyticsConsentStatus()).resolves.toBeNull()
    })

    it("returns the current analytics consent status when the stored record matches the policy", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            status: "declined",
            policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
            source: "settings",
            timestamp: "2026-04-17T12:00:00.000Z",
        })

        await expect(getCurrentAnalyticsConsentStatus()).resolves.toBe("declined")
    })

    it("persists analytics consent metadata when a choice is saved", async () => {
        await setAnalyticsConsent("granted", "settings")

        expect(setStoredJson).toHaveBeenCalledWith(
            ANALYTICS_CONSENT_STORAGE_KEY,
            expect.objectContaining({
                status: "granted",
                policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
                source: "settings",
                timestamp: expect.any(String),
            }),
        )
    })

    it("reads and versions analytics prompt state separately from consent", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
            source: "kvarteret_prompt",
            timestamp: "2026-04-17T12:00:00.000Z",
        })

        await expect(getStoredAnalyticsPromptState()).resolves.toEqual({
            policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
            source: "kvarteret_prompt",
            timestamp: "2026-04-17T12:00:00.000Z",
        })
        await expect(getHasSeenAnalyticsPromptCurrentVersion()).resolves.toBe(true)
        expect(getStoredJson).toHaveBeenCalledWith(ANALYTICS_PROMPT_STATE_STORAGE_KEY)
    })

    it("returns false when the current analytics prompt has not been seen", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            policyVersion: "2026-02-01",
            source: "kvarteret_prompt",
            timestamp: "2026-04-17T12:00:00.000Z",
        })

        await expect(getHasSeenAnalyticsPromptCurrentVersion()).resolves.toBe(false)
    })

    it("persists analytics prompt metadata when the prompt is dismissed", async () => {
        await markAnalyticsPromptSeen("kvarteret_prompt")

        expect(setStoredJson).toHaveBeenCalledWith(
            ANALYTICS_PROMPT_STATE_STORAGE_KEY,
            expect.objectContaining({
                policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
                source: "kvarteret_prompt",
                timestamp: expect.any(String),
            }),
        )
    })
})
