import { getHighestTier, User } from "@/shared/types/user"

export const MEMBERSHIP_BENEFIT_TIERS = [1, 2, 3] as const

export type MembershipBenefitTier = (typeof MEMBERSHIP_BENEFIT_TIERS)[number]

export const membershipBenefitKeysByTier = {
    1: [
        "tierBenefitTeaCoffee",
        "tierBenefitHansa04",
        "tierBenefitHansaPitcher",
        "tierBenefitWineGlass",
        "tierBenefitGrevensPearCider",
        "tierBenefitHansaLiteGf",
        "tierBenefitHeineken00",
        "tierBenefitMineralWater033",
        "tierBenefitInternalParties",
        "tierBenefitMafiaNach",
    ],
    2: [
        "tierBenefitTeaCoffee",
        "tierBenefitHansa04",
        "tierBenefitHansaPitcher",
        "tierBenefitWineGlass",
        "tierBenefitGrevensPearCider",
        "tierBenefitBulmersTapBottle",
        "tierBenefitKinnPilegrimGlutenFree",
        "tierBenefitHansaLiteGf",
        "tierBenefitLiefmansFruitesse",
        "tierBenefitGingerJuice",
        "tierBenefitGingerJoeAlcoholFree",
        "tierBenefitNogneStrippedCraftAlcoholFree",
        "tierBenefitHeineken00",
        "tierBenefitMineralWater033",
        "tierBenefitMatStjernenNoCake",
        "tierBenefitMainEntrancePriority",
        "tierBenefitFreeEntryWholeHouse",
        "tierBenefitQueuePriorityPlusOne",
        "tierBenefitInternalParties",
        "tierBenefitMafiaNach",
        "tierBenefitWineBottleDiscount",
        "tierBenefitGodtBrodOnShift",
    ],
    3: [
        "tierBenefitTeaCoffee",
        "tierBenefitHansa04",
        "tierBenefitHansaPitcher",
        "tierBenefitWineGlass",
        "tierBenefitGrevensPearCider",
        "tierBenefitBulmersTapBottle",
        "tierBenefitKinnPilegrimGlutenFree",
        "tierBenefitHansaLiteGf",
        "tierBenefitSolGlutenReduced",
        "tierBenefitKinnHavblikk",
        "tierBenefitNogneAsianPaleAle",
        "tierBenefitHeinekenBottle",
        "tierBenefitLiefmansFruitesse",
        "tierBenefitGingerJuice",
        "tierBenefitGingerJoeAlcoholFree",
        "tierBenefitNogneStrippedCraftAlcoholFree",
        "tierBenefitHeineken00",
        "tierBenefitCoffeeDrinks",
        "tierBenefitMineralWater033",
        "tierBenefitCult033",
        "tierBenefitMangoIpaTap",
        "tierBenefitAllTapGrondahls",
        "tierBenefitHardSeltzer",
        "tierBenefitLongDrinksHalvtimen",
        "tierBenefitSnacks",
        "tierBenefitMatStjernenWithCake",
        "tierBenefitSoftDrinks",
        "tierBenefitFamilyDinner",
        "tierBenefitTaxiRefundAfterShift",
        "tierBenefitGuestListByAgreement",
        "tierBenefitMainEntrancePriority",
        "tierBenefitFreeEntryWholeHouse",
        "tierBenefitQueuePriorityPlusFive",
        "tierBenefitInternalParties",
        "tierBenefitMafiaNach",
        "tierBenefitFrenchTacosDiscount",
        "tierBenefitShiftSoda",
        "tierBenefitWineBottleDiscount",
        "tierBenefitGodtBrodAlways",
    ],
} as const

export type MembershipBenefitTranslationKey =
    (typeof membershipBenefitKeysByTier)[MembershipBenefitTier][number]

export const getMembershipBenefitTranslationKeys = (
    tier: MembershipBenefitTier,
): readonly MembershipBenefitTranslationKey[] => membershipBenefitKeysByTier[tier]

export const isMembershipBenefitTier = (value: number): value is MembershipBenefitTier =>
    MEMBERSHIP_BENEFIT_TIERS.includes(value as MembershipBenefitTier)

export const resolveInitialMembershipBenefitTier = (
    user: User | null,
): MembershipBenefitTier | null => {
    if (!user) {
        return null
    }

    const highestTier = getHighestTier(user)

    return isMembershipBenefitTier(highestTier) ? highestTier : null
}
