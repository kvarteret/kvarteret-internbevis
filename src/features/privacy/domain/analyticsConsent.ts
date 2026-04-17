import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

export const ANALYTICS_CONSENT_STORAGE_KEY = "analytics_consent"
export const ANALYTICS_PROMPT_STATE_STORAGE_KEY = "analytics_prompt_state"

export type AnalyticsConsentStatus = "granted" | "declined"
export type AnalyticsConsentSource = "kvarteret_prompt" | "settings"
export type AnalyticsPromptSource = "kvarteret_prompt" | "settings"

export interface AnalyticsConsentRecord {
    status: AnalyticsConsentStatus
    policyVersion: string
    source: AnalyticsConsentSource
    timestamp: string
}

export interface AnalyticsPromptStateRecord {
    policyVersion: string
    source: AnalyticsPromptSource
    timestamp: string
}

export const resolveCurrentAnalyticsConsentStatus = (
    record: AnalyticsConsentRecord | null | undefined,
): AnalyticsConsentStatus | null =>
    record && record.policyVersion === CURRENT_PRIVACY_POLICY_VERSION ? record.status : null

export const hasSeenCurrentAnalyticsPrompt = (
    record: AnalyticsPromptStateRecord | null | undefined,
): boolean => record?.policyVersion === CURRENT_PRIVACY_POLICY_VERSION

export const shouldShowAnalyticsConsentPrompt = ({
    hasAcknowledgedCurrentPolicy,
    analyticsConsentStatus,
    hasSeenAnalyticsPromptCurrentVersion,
}: {
    hasAcknowledgedCurrentPolicy: boolean
    analyticsConsentStatus: AnalyticsConsentStatus | null
    hasSeenAnalyticsPromptCurrentVersion: boolean
}): boolean =>
    hasAcknowledgedCurrentPolicy &&
    analyticsConsentStatus === null &&
    !hasSeenAnalyticsPromptCurrentVersion
