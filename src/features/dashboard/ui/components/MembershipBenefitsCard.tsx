import React from "react"
import { Pressable, View } from "react-native"
import {
    MEMBERSHIP_BENEFIT_TIERS,
    MembershipBenefitTier,
} from "@/features/dashboard/domain/membershipBenefits"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface MembershipBenefitsCardProps {
    title: string
    description: string
    selectedTier: MembershipBenefitTier | null
    benefitLabels: string[]
    tierLabel: (tier: MembershipBenefitTier) => string
    onSelectTier: (tier: MembershipBenefitTier) => void
}

export const MembershipBenefitsCard = ({
    title,
    description,
    selectedTier,
    benefitLabels,
    tierLabel,
    onSelectTier,
}: MembershipBenefitsCardProps): React.JSX.Element | null => {
    if (selectedTier === null) {
        return null
    }

    return (
        <Card className="gap-4 px-4 py-4" effect="liquid" variant="grouped">
            <View className="gap-1">
                <Text className="text-base font-semibold">{title}</Text>
                <Text className="text-sm leading-5 text-text-secondary">{description}</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
                {MEMBERSHIP_BENEFIT_TIERS.map(tier => {
                    const isSelected = tier === selectedTier

                    return (
                        <Pressable
                            key={tier}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            className={cn(
                                "rounded-full border px-4 py-2",
                                isSelected ? "border-link bg-link" : "border-border bg-surface",
                            )}
                            onPress={() => onSelectTier(tier)}
                            testID={`membership-benefits-tier-${tier}`}
                        >
                            <Text
                                className={cn(
                                    "text-sm font-semibold",
                                    isSelected ? "text-surface" : "text-text-primary",
                                )}
                            >
                                {tierLabel(tier)}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>

            <View className="gap-3">
                {benefitLabels.map(benefit => (
                    <View key={`${selectedTier}:${benefit}`} className="flex-row gap-3">
                        <View className="mt-2 h-2 w-2 rounded-full bg-link" />
                        <Text className="min-w-0 flex-1 text-sm leading-5">{benefit}</Text>
                    </View>
                ))}
            </View>
        </Card>
    )
}
