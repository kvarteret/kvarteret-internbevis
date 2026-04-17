import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import {
    ANALYTICS_CONSENT_STORAGE_KEY,
    ANALYTICS_PROMPT_STATE_STORAGE_KEY,
    AnalyticsConsentRecord,
    AnalyticsConsentSource,
    AnalyticsConsentStatus,
    AnalyticsPromptSource,
    AnalyticsPromptStateRecord,
    hasSeenCurrentAnalyticsPrompt,
    resolveCurrentAnalyticsConsentStatus,
} from "@/features/privacy/domain/analyticsConsent"
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

export const getStoredAnalyticsConsent = async (): Promise<AnalyticsConsentRecord | null> =>
    getStoredJson<AnalyticsConsentRecord>(ANALYTICS_CONSENT_STORAGE_KEY)

export const getCurrentAnalyticsConsentStatus = async (): Promise<AnalyticsConsentStatus | null> =>
    resolveCurrentAnalyticsConsentStatus(await getStoredAnalyticsConsent())

export const getStoredAnalyticsPromptState = async (): Promise<AnalyticsPromptStateRecord | null> =>
    getStoredJson<AnalyticsPromptStateRecord>(ANALYTICS_PROMPT_STATE_STORAGE_KEY)

export const getHasSeenAnalyticsPromptCurrentVersion = async (): Promise<boolean> =>
    hasSeenCurrentAnalyticsPrompt(await getStoredAnalyticsPromptState())

export const setAnalyticsConsent = async (
    status: AnalyticsConsentStatus,
    source: AnalyticsConsentSource,
): Promise<void> => {
    await setStoredJson(ANALYTICS_CONSENT_STORAGE_KEY, {
        status,
        source,
        policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        timestamp: new Date().toISOString(),
    } satisfies AnalyticsConsentRecord)
}

export const markAnalyticsPromptSeen = async (source: AnalyticsPromptSource): Promise<void> => {
    await setStoredJson(ANALYTICS_PROMPT_STATE_STORAGE_KEY, {
        policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        source,
        timestamp: new Date().toISOString(),
    } satisfies AnalyticsPromptStateRecord)
}
