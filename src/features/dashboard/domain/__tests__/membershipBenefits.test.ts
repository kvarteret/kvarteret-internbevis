import {
    getMembershipBenefitTranslationKeys,
    MEMBERSHIP_BENEFIT_TIERS,
    resolveInitialMembershipBenefitTier,
} from "../membershipBenefits"
import { User } from "@/shared/types/user"

const createUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    fornavn: "Test",
    etternavn: "User",
    fodselsdato: null,
    opprettet: null,
    gyldigTil: new Date("2026-01-01T00:00:00.000Z"),
    bildeUrl: undefined,
    pingvinPoengSum: 0,
    aktiveVerv: [],
    dagensOrd: "ord",
    ...overrides,
})

describe("membership benefits", () => {
    it.each([1, 2, 3] as const)("uses the current highest tier %s as default selection", tier => {
        const user = createUser({
            aktiveVerv: [
                {
                    navn: "Verv",
                    gruppe: "Gruppe",
                    signertKontrakt: true,
                    rabattTrinn: tier,
                    pingvinPoeng: 1,
                },
            ],
        })

        expect(resolveInitialMembershipBenefitTier(user)).toBe(tier)
    })

    it("returns no selected tier for tier 0 users", () => {
        const user = createUser({
            aktiveVerv: [],
            pingvinPoengSum: 0,
        })

        expect(resolveInitialMembershipBenefitTier(user)).toBeNull()
    })

    it("returns tier 3 for pingvin users without active roles", () => {
        const user = createUser({
            aktiveVerv: [],
            pingvinPoengSum: 14,
        })

        expect(resolveInitialMembershipBenefitTier(user)).toBe(3)
    })

    it("keeps explicit benefit lists for all available tiers", () => {
        expect(MEMBERSHIP_BENEFIT_TIERS).toEqual([1, 2, 3])

        for (const tier of MEMBERSHIP_BENEFIT_TIERS) {
            expect(getMembershipBenefitTranslationKeys(tier).length).toBeGreaterThan(0)
        }

        expect(getMembershipBenefitTranslationKeys(1)).toContain("tierBenefitTeaCoffee")
        expect(getMembershipBenefitTranslationKeys(2)).toContain("tierBenefitBulmersTapBottle")
        expect(getMembershipBenefitTranslationKeys(3)).toContain("tierBenefitQueuePriorityPlusFive")
    })
})
