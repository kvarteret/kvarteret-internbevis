jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredValue: jest.fn(),
    setStoredValue: jest.fn(),
}))

import { getStoredValue, setStoredValue } from "@/core/storage/asyncStorage"
import {
    acknowledgeCurrentPrivacyPolicy,
    getAcknowledgedPrivacyPolicyVersion,
    hasAcknowledgedCurrentPrivacyPolicy,
} from "@/features/privacy/data/privacyConsentRepository"
import { ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY } from "@/features/privacy/domain/privacyConsent"
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

describe("privacyConsentRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("reads the stored acknowledged privacy policy version", async () => {
        ;(getStoredValue as jest.Mock).mockResolvedValue(CURRENT_PRIVACY_POLICY_VERSION)

        await expect(getAcknowledgedPrivacyPolicyVersion()).resolves.toBe(
            CURRENT_PRIVACY_POLICY_VERSION,
        )
        expect(getStoredValue).toHaveBeenCalledWith(ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY)
    })

    it("reports false when no acknowledged version has been stored", async () => {
        ;(getStoredValue as jest.Mock).mockResolvedValue(null)

        await expect(hasAcknowledgedCurrentPrivacyPolicy()).resolves.toBe(false)
    })

    it("reports false when a stale policy version is stored", async () => {
        ;(getStoredValue as jest.Mock).mockResolvedValue("2026-02-01")

        await expect(hasAcknowledgedCurrentPrivacyPolicy()).resolves.toBe(false)
    })

    it("reports true when the stored version matches the current policy", async () => {
        ;(getStoredValue as jest.Mock).mockResolvedValue(CURRENT_PRIVACY_POLICY_VERSION)

        await expect(hasAcknowledgedCurrentPrivacyPolicy()).resolves.toBe(true)
    })

    it("persists the current privacy policy version when acknowledging", async () => {
        await acknowledgeCurrentPrivacyPolicy()

        expect(setStoredValue).toHaveBeenCalledWith(
            ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY,
            CURRENT_PRIVACY_POLICY_VERSION,
        )
    })
})
