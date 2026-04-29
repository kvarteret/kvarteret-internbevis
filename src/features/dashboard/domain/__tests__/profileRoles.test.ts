import { User } from "@/shared/types/user"
import {
    arePersistedRoleSelectionsEqual,
    buildDisplayRoles,
    buildVolunteerHistoryRows,
    isPersistedRoleSelection,
    isPersistedRoleSelectionArray,
    resolveDefaultRoleSelections,
    resolvePersistedRoleSelections,
    serializeRoleSelection,
    serializeRoleSelections,
    toggleFrontPageRoleSelection,
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
    vervHistorikk: [],
    dagensOrd: "",
    ...overrides,
})

describe("buildDisplayRoles", () => {
    it("sorts active roles by pingvinPoeng desc, then tier, group, and name", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "Vakt",
                    gruppe: "PR-Etaten",
                    rabattTrinn: 1,
                    pingvinPoeng: 8,
                    signertKontrakt: true,
                },
                {
                    navn: "Nestleder",
                    gruppe: "Styret",
                    rabattTrinn: 2,
                    pingvinPoeng: 10,
                    signertKontrakt: true,
                },
                {
                    navn: "Leder",
                    gruppe: "Styret",
                    rabattTrinn: 3,
                    pingvinPoeng: 10,
                    signertKontrakt: true,
                },
                {
                    navn: "Barvakt",
                    gruppe: "Bodega",
                    rabattTrinn: null,
                    pingvinPoeng: 3,
                    signertKontrakt: true,
                },
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

    it("keeps the virtual Pingvin role first when eligible", () => {
        const user = createUser({
            pingvinPoengSum: 14,
            aktiveVerv: [
                {
                    navn: "Vakt",
                    gruppe: "PR-Etaten",
                    rabattTrinn: 3,
                    pingvinPoeng: 99,
                    signertKontrakt: true,
                },
            ],
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

    it("normalizes missing role strings and invalid numeric fields", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "   ",
                    gruppe: "",
                    rabattTrinn: Number.NaN as unknown as number,
                    pingvinPoeng: Number.NaN as unknown as number,
                    signertKontrakt: false,
                },
            ],
        })

        const roles = buildDisplayRoles(user)

        expect(roles[0]).toMatchObject({
            navn: "-",
            gruppe: "-",
            rabattTrinn: null,
            pingvinPoeng: 0,
            signertKontrakt: false,
            source: "active",
        })
    })
})

describe("buildVolunteerHistoryRows", () => {
    it("uses full volunteer history when available and sorts active roles first", () => {
        const rows = buildVolunteerHistoryRows(
            createUser({
                aktiveVerv: [
                    {
                        navn: "Current fallback",
                        gruppe: "Fallback",
                        rabattTrinn: 1,
                        pingvinPoeng: 1,
                        signertKontrakt: true,
                    },
                ],
                vervHistorikk: [
                    {
                        navn: "Tidligere medlem",
                        gruppe: "PR-Etaten",
                        rabattTrinn: 1,
                        pingvinPoeng: 3,
                        signertKontrakt: true,
                        startet: null,
                        sluttet: null,
                        ar: 2024,
                        semester: "Vår",
                        aktiv: false,
                    },
                    {
                        navn: "Utvikler",
                        gruppe: "E-Tjenesten",
                        rabattTrinn: 3,
                        pingvinPoeng: 12,
                        signertKontrakt: true,
                        startet: null,
                        sluttet: null,
                        ar: 2023,
                        semester: "Høst",
                        aktiv: true,
                    },
                ],
            }),
        )

        expect(rows.map(role => role.navn)).toEqual(["Utvikler", "Tidligere medlem"])
    })

    it("falls back to active roles until the API provides history", () => {
        const rows = buildVolunteerHistoryRows(
            createUser({
                aktiveVerv: [
                    {
                        navn: "Medlem",
                        gruppe: "PR-Etaten",
                        rabattTrinn: 2,
                        pingvinPoeng: 6,
                        signertKontrakt: true,
                    },
                ],
            }),
        )

        expect(rows).toEqual([
            expect.objectContaining({
                aktiv: true,
                gruppe: "PR-Etaten",
                navn: "Medlem",
            }),
        ])
    })
})

describe("ordered role selection helpers", () => {
    it("resolves persisted selections in their saved order", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "A",
                    gruppe: "G1",
                    rabattTrinn: 1,
                    pingvinPoeng: 1,
                    signertKontrakt: true,
                },
                {
                    navn: "B",
                    gruppe: "G2",
                    rabattTrinn: 2,
                    pingvinPoeng: 5,
                    signertKontrakt: true,
                },
                {
                    navn: "C",
                    gruppe: "G3",
                    rabattTrinn: 3,
                    pingvinPoeng: 9,
                    signertKontrakt: true,
                },
            ],
        })
        const roles = buildDisplayRoles(user)
        const selections = [serializeRoleSelection(roles[2]), serializeRoleSelection(roles[0])]

        const resolved = resolvePersistedRoleSelections(roles, selections)

        expect(resolved.map(role => role.selectionKey)).toEqual([
            roles[2]?.selectionKey,
            roles[0]?.selectionKey,
        ])
    })

    it("fills defaults up to three selections while preserving a preferred legacy role first", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "A",
                    gruppe: "G1",
                    rabattTrinn: 1,
                    pingvinPoeng: 1,
                    signertKontrakt: true,
                },
                {
                    navn: "B",
                    gruppe: "G2",
                    rabattTrinn: 2,
                    pingvinPoeng: 5,
                    signertKontrakt: true,
                },
                {
                    navn: "C",
                    gruppe: "G3",
                    rabattTrinn: 3,
                    pingvinPoeng: 9,
                    signertKontrakt: true,
                },
                {
                    navn: "D",
                    gruppe: "G4",
                    rabattTrinn: 0,
                    pingvinPoeng: 12,
                    signertKontrakt: true,
                },
            ],
        })
        const roles = buildDisplayRoles(user)

        const defaults = resolveDefaultRoleSelections(roles, [serializeRoleSelection(roles[2])])

        expect(defaults.map(role => role.selectionKey)).toEqual([
            roles[2]?.selectionKey,
            roles[0]?.selectionKey,
            roles[1]?.selectionKey,
        ])
    })

    it("adds roles until max three and blocks additional roles", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "A",
                    gruppe: "G1",
                    rabattTrinn: 1,
                    pingvinPoeng: 1,
                    signertKontrakt: true,
                },
                {
                    navn: "B",
                    gruppe: "G2",
                    rabattTrinn: 2,
                    pingvinPoeng: 2,
                    signertKontrakt: true,
                },
                {
                    navn: "C",
                    gruppe: "G3",
                    rabattTrinn: 3,
                    pingvinPoeng: 3,
                    signertKontrakt: true,
                },
                {
                    navn: "D",
                    gruppe: "G4",
                    rabattTrinn: 0,
                    pingvinPoeng: 4,
                    signertKontrakt: true,
                },
            ],
        })
        const roles = buildDisplayRoles(user)
        const currentSelections = serializeRoleSelections(roles.slice(0, 3))

        const result = toggleFrontPageRoleSelection(roles, currentSelections, roles[3]!)

        expect(result.action).toBe("blocked_max")
        expect(result.nextSelections).toEqual(currentSelections)
    })

    it("removes selected roles and compacts the remaining order", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "A",
                    gruppe: "G1",
                    rabattTrinn: 1,
                    pingvinPoeng: 1,
                    signertKontrakt: true,
                },
                {
                    navn: "B",
                    gruppe: "G2",
                    rabattTrinn: 2,
                    pingvinPoeng: 2,
                    signertKontrakt: true,
                },
                {
                    navn: "C",
                    gruppe: "G3",
                    rabattTrinn: 3,
                    pingvinPoeng: 3,
                    signertKontrakt: true,
                },
            ],
        })
        const roles = buildDisplayRoles(user)
        const currentSelections = serializeRoleSelections(roles.slice(0, 3))

        const result = toggleFrontPageRoleSelection(roles, currentSelections, roles[1]!)

        expect(result.action).toBe("removed")
        expect(result.nextSelections).toEqual([
            serializeRoleSelection(roles[0]!),
            serializeRoleSelection(roles[2]!),
        ])
    })

    it("allows removing the final selected role", () => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "A",
                    gruppe: "G1",
                    rabattTrinn: 1,
                    pingvinPoeng: 1,
                    signertKontrakt: true,
                },
            ],
        })
        const roles = buildDisplayRoles(user)
        const currentSelections = [serializeRoleSelection(roles[0]!)]

        const result = toggleFrontPageRoleSelection(roles, currentSelections, roles[0]!)

        expect(result.action).toBe("removed")
        expect(result.nextSelections).toEqual([])
    })

    it("compares persisted selection arrays by value and order", () => {
        const left = [
            { source: "active", navn: "A", gruppe: "G1", rabattTrinn: 1 } as const,
            { source: "active", navn: "B", gruppe: "G2", rabattTrinn: 2 } as const,
        ]
        const same = [
            { source: "active", navn: "A", gruppe: "G1", rabattTrinn: 1 } as const,
            { source: "active", navn: "B", gruppe: "G2", rabattTrinn: 2 } as const,
        ]
        const reordered = [
            { source: "active", navn: "B", gruppe: "G2", rabattTrinn: 2 } as const,
            { source: "active", navn: "A", gruppe: "G1", rabattTrinn: 1 } as const,
        ]

        expect(arePersistedRoleSelectionsEqual(left, same)).toBe(true)
        expect(arePersistedRoleSelectionsEqual(left, reordered)).toBe(false)
    })

    it("validates persisted single selections and selection arrays", () => {
        expect(
            isPersistedRoleSelection({
                source: "virtual_pingvin",
                navn: "Pingvin",
                gruppe: "Pingvin Ordenen",
                rabattTrinn: 3,
            }),
        ).toBe(true)
        expect(
            isPersistedRoleSelectionArray([
                {
                    source: "active",
                    navn: "Leder",
                    gruppe: "Styret",
                    rabattTrinn: 3,
                },
            ]),
        ).toBe(true)
        expect(isPersistedRoleSelection({ source: "active", navn: 1 })).toBe(false)
        expect(isPersistedRoleSelectionArray([{ source: "active", navn: 1 }])).toBe(false)
    })
})
