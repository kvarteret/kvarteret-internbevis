import { User } from "@/shared/types/user"
import {
    buildDisplayRoles,
    hasPersistedRoleSelectionMatch,
    isPersistedRoleSelection,
    resolveDisplayedRole,
    serializeRoleSelection,
} from "../profileRoles"

const createUser = (overrides: Partial<User> = {}): User => ({
    id: 42,
    fornavn: "Ada",
    etternavn: "Lovelace",
    fodselsdato: null,
    opprettet: null,
    gyldigTil: new Date("2026-01-01T00:00:00.000Z"),
    bildeUrl: undefined,
    pingvinPoengSum: 0,
    aktiveVerv: [],
    dagensOrd: "",
    ...overrides,
})

describe("buildDisplayRoles", () => {
    it("sorts active roles by raw rabattTrinn desc and then by group/name", () => {
        const user = createUser({
            aktiveVerv: [
                { navn: "Vakt", gruppe: "PR-Etaten", rabattTrinn: 1, signertKontrakt: true },
                { navn: "Nestleder", gruppe: "Styret", rabattTrinn: 3, signertKontrakt: true },
                { navn: "Leder", gruppe: "Styret", rabattTrinn: 3, signertKontrakt: true },
                { navn: "Barvakt", gruppe: "Bodega", rabattTrinn: null, signertKontrakt: true },
            ],
        })

        const roles = buildDisplayRoles(user)

        expect(roles.map(role => `${role.gruppe}:${role.navn}`)).toEqual([
            "Styret:Leder",
            "Styret:Nestleder",
            "PR-Etaten:Vakt",
            "Bodega:Barvakt",
        ])
    })

    it("prepends a virtual Pingvin row when pingvinPoengSum is 14 or more", () => {
        const user = createUser({
            pingvinPoengSum: 14,
            aktiveVerv: [{ navn: "Vakt", gruppe: "PR-Etaten", rabattTrinn: 1, signertKontrakt: true }],
        })

        const roles = buildDisplayRoles(user)

        expect(roles[0]).toMatchObject({
            source: "virtual_pingvin",
            navn: "Pingvin",
            gruppe: "Pingvin Ordenen",
            rabattTrinn: 3,
            signertKontrakt: true,
        })
    })

    it("keeps active role count and prepends only one virtual Pingvin row", () => {
        const user = createUser({
            pingvinPoengSum: 30,
            aktiveVerv: [
                { navn: "A", gruppe: "G1", rabattTrinn: 2, signertKontrakt: true },
                { navn: "B", gruppe: "G2", rabattTrinn: 1, signertKontrakt: false },
            ],
        })

        const roles = buildDisplayRoles(user)

        expect(roles).toHaveLength(3)
        expect(roles.filter(role => role.source === "virtual_pingvin")).toHaveLength(1)
    })

    it("normalizes missing role strings and invalid tier values", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "   ",
                    gruppe: "",
                    rabattTrinn: Number.NaN as unknown as number,
                    signertKontrakt: false,
                },
            ],
        })

        const roles = buildDisplayRoles(user)

        expect(roles[0]).toMatchObject({
            navn: "-",
            gruppe: "-",
            rabattTrinn: null,
            signertKontrakt: false,
            source: "active",
        })
    })
})

describe("selection helpers", () => {
    it("serializes and resolves selected role when it exists", () => {
        const user = createUser({
            aktiveVerv: [
                { navn: "A", gruppe: "G1", rabattTrinn: 1, signertKontrakt: true },
                { navn: "B", gruppe: "G2", rabattTrinn: 2, signertKontrakt: true },
            ],
        })
        const roles = buildDisplayRoles(user)
        const wanted = roles[1]
        const selection = serializeRoleSelection(wanted)

        const resolved = resolveDisplayedRole(roles, selection)

        expect(resolved?.selectionKey).toBe(wanted.selectionKey)
        expect(hasPersistedRoleSelectionMatch(roles, selection)).toBe(true)
    })

    it("falls back to first role when persisted selection is missing", () => {
        const user = createUser({
            aktiveVerv: [{ navn: "A", gruppe: "G1", rabattTrinn: 1, signertKontrakt: true }],
        })
        const roles = buildDisplayRoles(user)

        const resolved = resolveDisplayedRole(roles, {
            source: "active",
            navn: "Missing",
            gruppe: "Missing",
            rabattTrinn: 9,
        })

        expect(resolved?.selectionKey).toBe(roles[0].selectionKey)
    })

    it("handles empty roles safely", () => {
        expect(resolveDisplayedRole([], null)).toBeNull()
        expect(hasPersistedRoleSelectionMatch([], null)).toBe(false)
    })

    it("validates persisted role selection shape", () => {
        expect(
            isPersistedRoleSelection({
                source: "virtual_pingvin",
                navn: "Pingvin",
                gruppe: "Pingvin Ordenen",
                rabattTrinn: 3,
            }),
        ).toBe(true)
        expect(isPersistedRoleSelection({ source: "active", navn: 1 })).toBe(false)
    })
})
