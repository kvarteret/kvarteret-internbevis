import { CURRENT_PRIVACY_POLICY_VERSION } from "@/features/privacy/domain/privacyPolicy"

export const ACKNOWLEDGED_PRIVACY_POLICY_VERSION_STORAGE_KEY = "privacy_policy_acknowledged_version"

export const isCurrentPrivacyPolicyAcknowledged = (
    acknowledgedVersion: string | null | undefined,
): boolean => acknowledgedVersion === CURRENT_PRIVACY_POLICY_VERSION

export const shouldShowPrivacyNoticeDialog = ({
    firstSegment,
    hasAcknowledgedCurrentPolicy,
}: {
    firstSegment: string | undefined
    hasAcknowledgedCurrentPolicy: boolean
}): boolean =>
    !hasAcknowledgedCurrentPolicy && firstSegment !== undefined && firstSegment !== "privacy"
