import { osloWallClock } from "@/shared/time/osloTime"
import type {
    InternKortVerv,
    InternKortVervHistorikk,
    RabattTrinn,
    User,
} from "@/shared/types/user"

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

type SemesterTerm = 1 | 2

interface SemesterReference {
    year: number
    term: SemesterTerm
}

const getGracePeriodSemester = (now: Date): SemesterReference | null => {
    const { year, month, day } = osloWallClock(now)

    // The backend starts querying the next semester on January 1 and July 1,
    // before volunteer assignments for that semester are necessarily updated.
    // Carry the previous semester through January 14 and August 31.
    if (month === 1 && day < 15) {
        return { year: year - 1, term: 2 }
    }

    if (month >= 7 && month <= 8) {
        return { year, term: 1 }
    }

    return null
}

const getHistoryTerm = (semester: string | null): SemesterTerm | null => {
    const normalized = semester?.trim().toLowerCase() ?? ""
    if (normalized === "1" || normalized.includes("vår")) {
        return 1
    }

    if (normalized === "2" || normalized.includes("høst")) {
        return 2
    }

    return null
}

export const getEffectiveActiveRoles = (user: User, now: Date = new Date()): InternKortVerv[] => {
    if (user.aktiveVerv.length > 0) {
        return user.aktiveVerv
    }

    const graceSemester = getGracePeriodSemester(now)
    if (!graceSemester) {
        return []
    }

    return user.vervHistorikk.filter(
        (role: InternKortVervHistorikk) =>
            role.ar === graceSemester.year && getHistoryTerm(role.semester) === graceSemester.term,
    )
}

const getHighestTierVerv = <TRole extends Pick<InternKortVerv, "rabattTrinn">>(
    roles: ReadonlyArray<TRole>,
): TRole | null => {
    let highest: TRole | null = null
    for (const verv of roles) {
        if (!highest || rankTier(verv.rabattTrinn) > rankTier(highest.rabattTrinn)) {
            highest = verv
        }
    }

    return highest
}

export const getHighestTierFromRoles = (
    roles: ReadonlyArray<Pick<InternKortVerv, "rabattTrinn">>,
): number => getHighestTierVerv(roles)?.rabattTrinn ?? 0

const hasAnyTierSource = (user: User, now: Date): boolean =>
    getEffectiveActiveRoles(user, now).length > 0 || hasPingvinValidity(user)

export const getHighestTier = (user: User, now: Date = new Date()): number => {
    if (!hasAnyTierSource(user, now)) {
        return 0
    }
    if (hasPingvinValidity(user)) {
        return PINGVIN_DISCOUNT_TIER
    }

    return getHighestTierVerv(getEffectiveActiveRoles(user, now))?.rabattTrinn ?? 0
}

export const getHighestTierGroup = (user: User, now: Date = new Date()): string => {
    if (!hasAnyTierSource(user, now)) {
        return ""
    }
    if (hasPingvinValidity(user)) {
        return PINGVIN_GROUP_NAME
    }

    return getHighestTierVerv(getEffectiveActiveRoles(user, now))?.gruppe ?? ""
}

export const getHighestTierName = (user: User, now: Date = new Date()): string => {
    if (!hasAnyTierSource(user, now)) {
        return ""
    }
    if (hasPingvinValidity(user)) {
        return PINGVIN_ROLE_NAME
    }

    return getHighestTierVerv(getEffectiveActiveRoles(user, now))?.navn ?? ""
}
