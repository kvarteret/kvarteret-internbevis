import { InternKortVerv, RabattTrinn, User } from "@/shared/types/user"

// Single owner of the membership-tier business rules (Pingvin threshold, tier
// ordering, virtual-role constants). Every other module imports from here;
// duplicating any of these values elsewhere is a review rejection.

export const PINGVIN_POINT_THRESHOLD = 14

export const PINGVIN_ROLE_NAME = "Pingvin"
export const PINGVIN_GROUP_NAME = "Pingvin Ordenen"
export const PINGVIN_DISCOUNT_TIER = 3

// Legacy `rabattTrinn` (backend `discount_level`) ordering map. The raw values
// are not ordered by magnitude: historically "0" denoted a mid-tier legacy
// level, so the effective ranking is null < 1 < 0 < 2 < 3. The backend OpenAPI
// spec types `discount_level` as a bare nullable integer without documenting
// this, so the ordering below preserves the behavior the app has always had.
// If the backend ever documents `discount_level`, reconcile this map with it.
const TIER_ORDERING: Record<string, number> = {
    null: 0,
    "1": 1,
    "0": 2,
    "2": 3,
    "3": 4,
}

const rankTier = (rabattTrinn: RabattTrinn): number => {
    const key = rabattTrinn === null ? "null" : String(rabattTrinn)
    return TIER_ORDERING[key] ?? 0
}

export const hasPingvinValidity = (user: User): boolean =>
    user.pingvinPoengSum >= PINGVIN_POINT_THRESHOLD

export const createPingvinRole = (): InternKortVerv => ({
    navn: PINGVIN_ROLE_NAME,
    gruppe: PINGVIN_GROUP_NAME,
    signertKontrakt: true,
    rabattTrinn: PINGVIN_DISCOUNT_TIER,
    pingvinPoeng: Number.MAX_SAFE_INTEGER,
})

const getHighestTierVerv = (user: User): InternKortVerv | null => {
    // Pingvin is always treated as the highest tier.
    if (hasPingvinValidity(user)) {
        return createPingvinRole()
    }

    let highest: InternKortVerv | null = null
    for (const verv of user.aktiveVerv) {
        if (!highest || rankTier(verv.rabattTrinn) > rankTier(highest.rabattTrinn)) {
            highest = verv
        }
    }

    return highest
}

const hasAnyTierSource = (user: User): boolean =>
    user.aktiveVerv.length > 0 || hasPingvinValidity(user)

export const getHighestTier = (user: User): number => {
    if (!hasAnyTierSource(user)) {
        return 0
    }
    return getHighestTierVerv(user)?.rabattTrinn ?? 0
}

export const getHighestTierGroup = (user: User): string => {
    if (!hasAnyTierSource(user)) {
        return ""
    }
    return getHighestTierVerv(user)?.gruppe ?? ""
}

export const getHighestTierName = (user: User): string => {
    if (!hasAnyTierSource(user)) {
        return ""
    }
    return getHighestTierVerv(user)?.navn ?? ""
}
