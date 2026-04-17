import { getStoredValue, setStoredValue } from "@/core/storage/asyncStorage"
import {
    ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY,
    isCurrentPrivacyPolicyAcknowledged,
} from "@/features/privacy/domain/privacyConsent"
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

export const getAcknowledgedPrivacyPolicyVersion = async (): Promise<string | null> =>
    getStoredValue(ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY)

export const acknowledgeCurrentPrivacyPolicy = async (): Promise<void> => {
    await setStoredValue(
        ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY,
        CURRENT_PRIVACY_POLICY_VERSION,
    )
}

export const hasAcknowledgedCurrentPrivacyPolicy = async (): Promise<boolean> =>
    isCurrentPrivacyPolicyAcknowledged(await getAcknowledgedPrivacyPolicyVersion())
