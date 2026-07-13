import {
    hasPingvinValidity,
    PINGVIN_DISCOUNT_TIER,
    PINGVIN_GROUP_NAME,
    PINGVIN_ROLE_NAME,
} from "@/shared/domain/membership"
import { InternKortVerv, InternKortVervHistorikk, User } from "@/shared/types/user"

export const MAX_FRONT_PAGE_ROLE_SELECTIONS = 3

export type DisplayRoleSource = "active" | "virtual_pingvin"

export interface DisplayRoleRow {
    source: DisplayRoleSource
    selectionKey: string
    navn: string
    gruppe: string
    rabattTrinn: number | null
    pingvinPoeng: number
    signertKontrakt: boolean
}

export interface PersistedRoleSelection {
    source: DisplayRoleSource
    navn: string
    gruppe: string
    rabattTrinn: number | null
}

export interface VolunteerHistoryRow {
    navn: string
    gruppe: string
    rabattTrinn: number | null
    pingvinPoeng: number
    signertKontrakt: boolean
    startet: string | null
    sluttet: string | null
    ar: number | null
    semester: string | null
    aktiv: boolean
}

export type ToggleRoleSelectionResult =
    | { action: "added"; nextSelections: PersistedRoleSelection[] }
    | { action: "removed"; nextSelections: PersistedRoleSelection[] }
    | { action: "blocked_max"; nextSelections: PersistedRoleSelection[] }

const VIRTUAL_PINGVIN_PRIORITY = Number.MAX_SAFE_INTEGER

const normalizeText = (value: string): string => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : "-"
}

const normalizeRabattTrinn = (value: number | null): number | null => {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        return null
    }

    return value
}

const normalizePingvinPoeng = (value: number | null | undefined): number => {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        return 0
    }

    return value
}

const createSelectionKey = (
    source: DisplayRoleSource,
    gruppe: string,
    navn: string,
    rabattTrinn: number | null,
    pingvinPoeng: number,
): string => `${source}:${gruppe}:${navn}:${rabattTrinn ?? "null"}:${pingvinPoeng}`

const normalizeActiveRole = (role: InternKortVerv): DisplayRoleRow => {
    const navn = normalizeText(role.navn)
    const gruppe = normalizeText(role.gruppe)
    const rabattTrinn = normalizeRabattTrinn(role.rabattTrinn)
    const pingvinPoeng = normalizePingvinPoeng(role.pingvinPoeng)

    return {
        source: "active",
        selectionKey: createSelectionKey("active", gruppe, navn, rabattTrinn, pingvinPoeng),
        navn,
        gruppe,
        rabattTrinn,
        pingvinPoeng,
        signertKontrakt: Boolean(role.signertKontrakt),
    }
}

const normalizeHistoryRole = (role: InternKortVervHistorikk): VolunteerHistoryRow => ({
    aktiv: role.aktiv,
    ar: typeof role.ar === "number" && Number.isInteger(role.ar) ? role.ar : null,
    gruppe: normalizeText(role.gruppe),
    navn: normalizeText(role.navn),
    pingvinPoeng: normalizePingvinPoeng(role.pingvinPoeng),
    rabattTrinn: normalizeRabattTrinn(role.rabattTrinn),
    semester: role.semester?.trim() || null,
    signertKontrakt: Boolean(role.signertKontrakt),
    sluttet: role.sluttet?.trim() || null,
    startet: role.startet?.trim() || null,
})

const activeRoleToHistoryRole = (role: InternKortVerv): VolunteerHistoryRow => ({
    ...normalizeHistoryRole({
        ...role,
        aktiv: true,
        ar: null,
        semester: null,
        sluttet: null,
        startet: null,
    }),
})

const getHistorySortTime = (role: VolunteerHistoryRow): number => {
    const explicitDate = role.sluttet ?? role.startet
    if (explicitDate) {
        const dateMs = new Date(explicitDate).getTime()
        if (!Number.isNaN(dateMs)) {
            return dateMs
        }
    }

    return role.ar ?? Number.NEGATIVE_INFINITY
}

const sortHistoryRows = (left: VolunteerHistoryRow, right: VolunteerHistoryRow): number => {
    if (left.aktiv !== right.aktiv) {
        return left.aktiv ? -1 : 1
    }

    const timeDiff = getHistorySortTime(right) - getHistorySortTime(left)
    if (timeDiff !== 0) {
        return timeDiff
    }

    const groupCompare = left.gruppe.localeCompare(right.gruppe, undefined, {
        sensitivity: "base",
    })
    if (groupCompare !== 0) {
        return groupCompare
    }

    return left.navn.localeCompare(right.navn, undefined, { sensitivity: "base" })
}

const sortByPriority = (a: DisplayRoleRow, b: DisplayRoleRow): number => {
    if (a.source !== b.source) {
        return a.source === "virtual_pingvin" ? -1 : 1
    }

    if (a.pingvinPoeng !== b.pingvinPoeng) {
        return b.pingvinPoeng - a.pingvinPoeng
    }

    const tierA = a.rabattTrinn ?? Number.NEGATIVE_INFINITY
    const tierB = b.rabattTrinn ?? Number.NEGATIVE_INFINITY

    if (tierA !== tierB) {
        return tierB - tierA
    }

    const groupCompare = a.gruppe.localeCompare(b.gruppe, undefined, { sensitivity: "base" })
    if (groupCompare !== 0) {
        return groupCompare
    }

    return a.navn.localeCompare(b.navn, undefined, { sensitivity: "base" })
}

const roleMatchesSelection = (role: DisplayRoleRow, selection: PersistedRoleSelection): boolean =>
    role.source === selection.source &&
    role.navn === selection.navn &&
    role.gruppe === selection.gruppe &&
    role.rabattTrinn === selection.rabattTrinn

export const isPersistedRoleSelection = (value: unknown): value is PersistedRoleSelection => {
    if (!value || typeof value !== "object") {
        return false
    }

    const candidate = value as Record<string, unknown>
    const source = candidate.source
    const navn = candidate.navn
    const gruppe = candidate.gruppe
    const rabattTrinn = candidate.rabattTrinn

    const isValidSource = source === "active" || source === "virtual_pingvin"
    const isValidName = typeof navn === "string"
    const isValidGroup = typeof gruppe === "string"
    const isValidTier =
        rabattTrinn === null || (typeof rabattTrinn === "number" && Number.isInteger(rabattTrinn))

    return isValidSource && isValidName && isValidGroup && isValidTier
}

export const isPersistedRoleSelectionArray = (
    value: unknown,
): value is PersistedRoleSelection[] => {
    if (!Array.isArray(value)) {
        return false
    }

    return value.every(isPersistedRoleSelection)
}

export const serializeRoleSelection = (role: DisplayRoleRow): PersistedRoleSelection => ({
    source: role.source,
    navn: role.navn,
    gruppe: role.gruppe,
    rabattTrinn: role.rabattTrinn,
})

export const serializeRoleSelections = (roles: DisplayRoleRow[]): PersistedRoleSelection[] =>
    roles.map(serializeRoleSelection)

export const arePersistedRoleSelectionsEqual = (
    left: PersistedRoleSelection[],
    right: PersistedRoleSelection[],
): boolean =>
    left.length === right.length &&
    left.every((selection, index) => {
        const other = right[index]

        return (
            other?.source === selection.source &&
            other?.navn === selection.navn &&
            other?.gruppe === selection.gruppe &&
            other?.rabattTrinn === selection.rabattTrinn
        )
    })

export const resolvePersistedRoleSelections = (
    roles: DisplayRoleRow[],
    selections: PersistedRoleSelection[],
): DisplayRoleRow[] => {
    const resolved: DisplayRoleRow[] = []
    const seenSelectionKeys = new Set<string>()

    for (const selection of selections.slice(0, MAX_FRONT_PAGE_ROLE_SELECTIONS)) {
        const match = roles.find(role => roleMatchesSelection(role, selection))
        if (!match || seenSelectionKeys.has(match.selectionKey)) {
            continue
        }

        seenSelectionKeys.add(match.selectionKey)
        resolved.push(match)
    }

    return resolved
}

export const resolveDefaultRoleSelections = (
    roles: DisplayRoleRow[],
    preferredSelections: PersistedRoleSelection[] = [],
): DisplayRoleRow[] => {
    const resolvedPreferredRoles = resolvePersistedRoleSelections(roles, preferredSelections)
    const seenSelectionKeys = new Set(resolvedPreferredRoles.map(role => role.selectionKey))
    const resolvedSelections = [...resolvedPreferredRoles]

    for (const role of roles) {
        if (resolvedSelections.length >= MAX_FRONT_PAGE_ROLE_SELECTIONS) {
            break
        }

        if (seenSelectionKeys.has(role.selectionKey)) {
            continue
        }

        seenSelectionKeys.add(role.selectionKey)
        resolvedSelections.push(role)
    }

    return resolvedSelections
}

export const toggleFrontPageRoleSelection = (
    roles: DisplayRoleRow[],
    currentSelections: PersistedRoleSelection[],
    role: DisplayRoleRow,
): ToggleRoleSelectionResult => {
    const resolvedCurrentRoles = resolvePersistedRoleSelections(roles, currentSelections)
    const currentPersistedSelections = serializeRoleSelections(resolvedCurrentRoles)
    const selectedRoleIndex = resolvedCurrentRoles.findIndex(
        currentRole => currentRole.selectionKey === role.selectionKey,
    )

    if (selectedRoleIndex >= 0) {
        return {
            action: "removed",
            nextSelections: currentPersistedSelections.filter(
                (_, index) => index !== selectedRoleIndex,
            ),
        }
    }

    if (resolvedCurrentRoles.length >= MAX_FRONT_PAGE_ROLE_SELECTIONS) {
        return {
            action: "blocked_max",
            nextSelections: currentPersistedSelections,
        }
    }

    return {
        action: "added",
        nextSelections: [...currentPersistedSelections, serializeRoleSelection(role)],
    }
}

export const buildDisplayRoles = (user: User): DisplayRoleRow[] => {
    const activeRoles = user.aktiveVerv.map(normalizeActiveRole).sort(sortByPriority)

    if (!hasPingvinValidity(user)) {
        return activeRoles
    }

    const pingvinRole: DisplayRoleRow = {
        source: "virtual_pingvin",
        selectionKey: createSelectionKey(
            "virtual_pingvin",
            PINGVIN_GROUP_NAME,
            PINGVIN_ROLE_NAME,
            PINGVIN_DISCOUNT_TIER,
            VIRTUAL_PINGVIN_PRIORITY,
        ),
        navn: PINGVIN_ROLE_NAME,
        gruppe: PINGVIN_GROUP_NAME,
        rabattTrinn: PINGVIN_DISCOUNT_TIER,
        pingvinPoeng: VIRTUAL_PINGVIN_PRIORITY,
        signertKontrakt: true,
    }

    return [pingvinRole, ...activeRoles]
}

export const buildVolunteerHistoryRows = (user: User): VolunteerHistoryRow[] => {
    const sourceRoles =
        user.vervHistorikk.length > 0
            ? user.vervHistorikk.map(normalizeHistoryRole)
            : user.aktiveVerv.map(activeRoleToHistoryRole)

    return sourceRoles.sort(sortHistoryRows)
}
