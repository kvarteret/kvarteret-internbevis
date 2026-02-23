import { getHighestTier, User } from "@/shared/types/user"

export type IdVerificationReason = "active-role" | "pingvin-points" | "none"

export interface IdVerificationStatus {
    isValid: boolean
    reason: IdVerificationReason
    tier: number
}

const hasActiveRole = (user: User): boolean => user.aktiveVerv.length > 0

const hasPingvinValidity = (user: User): boolean => user.pingvinPoengSum >= 14

export const isIdVerificationValid = (user: User): boolean =>
    hasActiveRole(user) || hasPingvinValidity(user)

export const getIdVerificationStatus = (user: User): IdVerificationStatus => {
    if (hasActiveRole(user)) {
        return {
            isValid: true,
            reason: "active-role",
            tier: getHighestTier(user),
        }
    }

    if (hasPingvinValidity(user)) {
        return {
            isValid: true,
            reason: "pingvin-points",
            tier: getHighestTier(user),
        }
    }

    return {
        isValid: false,
        reason: "none",
        tier: 0,
    }
}
