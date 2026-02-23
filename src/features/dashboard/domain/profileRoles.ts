import { InternKortVerv, User } from "@/shared/types/user"

export type DisplayRoleSource = "active" | "virtual_pingvin"

export interface DisplayRoleRow {
    source: DisplayRoleSource
    selectionKey: string
    navn: string
    gruppe: string
    rabattTrinn: number | null
    signertKontrakt: boolean
}

export interface PersistedRoleSelection {
    source: DisplayRoleSource
    navn: string
    gruppe: string
    rabattTrinn: number | null
}

const PINGVIN_NAME = "Pingvin"
const PINGVIN_GROUP = "Pingvin Ordenen"

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

const createSelectionKey = (
    source: DisplayRoleSource,
    gruppe: string,
    navn: string,
    rabattTrinn: number | null,
): string => `${source}:${gruppe}:${navn}:${rabattTrinn ?? "null"}`

const normalizeActiveRole = (role: InternKortVerv): DisplayRoleRow => {
    const navn = normalizeText(role.navn)
    const gruppe = normalizeText(role.gruppe)
    const rabattTrinn = normalizeRabattTrinn(role.rabattTrinn)

    return {
        source: "active",
        selectionKey: createSelectionKey("active", gruppe, navn, rabattTrinn),
        navn,
        gruppe,
        rabattTrinn,
        signertKontrakt: Boolean(role.signertKontrakt),
    }
}

const sortByRawTierGroupAndName = (a: DisplayRoleRow, b: DisplayRoleRow): number => {
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

const roleMatchesSelection = (
    role: DisplayRoleRow,
    selection: PersistedRoleSelection,
): boolean =>
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
    const isValidTier = rabattTrinn === null || (typeof rabattTrinn === "number" && Number.isInteger(rabattTrinn))

    return isValidSource && isValidName && isValidGroup && isValidTier
}

export const serializeRoleSelection = (role: DisplayRoleRow): PersistedRoleSelection => ({
    source: role.source,
    navn: role.navn,
    gruppe: role.gruppe,
    rabattTrinn: role.rabattTrinn,
})

export const hasPersistedRoleSelectionMatch = (
    roles: DisplayRoleRow[],
    selection: PersistedRoleSelection | null,
): boolean => {
    if (!selection) {
        return false
    }

    return roles.some(role => roleMatchesSelection(role, selection))
}

export const resolveDisplayedRole = (
    roles: DisplayRoleRow[],
    selection: PersistedRoleSelection | null,
): DisplayRoleRow | null => {
    if (roles.length === 0) {
        return null
    }

    if (!selection) {
        return roles[0]
    }

    return roles.find(role => roleMatchesSelection(role, selection)) ?? roles[0]
}

export const buildDisplayRoles = (user: User): DisplayRoleRow[] => {
    const activeRoles = user.aktiveVerv.map(normalizeActiveRole).sort(sortByRawTierGroupAndName)

    if (user.pingvinPoengSum < 14) {
        return activeRoles
    }

    const pingvinRole: DisplayRoleRow = {
        source: "virtual_pingvin",
        selectionKey: createSelectionKey("virtual_pingvin", PINGVIN_GROUP, PINGVIN_NAME, 3),
        navn: PINGVIN_NAME,
        gruppe: PINGVIN_GROUP,
        rabattTrinn: 3,
        signertKontrakt: true,
    }

    return [pingvinRole, ...activeRoles]
}
