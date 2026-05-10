import { MaterialIcons } from "@expo/vector-icons"
import { useNavigation } from "expo-router"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { Benefit, BenefitTier, fetchBenefits } from "@/features/benefits/data/benefitsRepository"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { getHighestTier } from "@/shared/types/user"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

const TIER_LABELS: Record<BenefitTier, string> = {
    trinn1: "Trinn 1",
    trinn2: "Trinn 2",
    trinn3: "Trinn 3",
}

const TIER_SUBLABELS: Record<BenefitTier, string> = {
    trinn1: "Brukerorganisasjon",
    trinn2: "Driftsorganisasjon",
    trinn3: "Arbeidsgruppe",
}

const TIER_TO_NUMBER: Record<BenefitTier, number> = {
    trinn1: 1,
    trinn2: 2,
    trinn3: 3,
}

const NUMBER_TO_TIER: Record<number, BenefitTier> = {
    1: "trinn1",
    2: "trinn2",
    3: "trinn3",
}

const ALL_TIERS: BenefitTier[] = ["trinn1", "trinn2", "trinn3"]

export const BenefitsScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const colors = useThemeRuntimeColors()
    const { user } = useSession()
    const userTier = user ? getHighestTier(user) : 0
    const userTierKey = userTier >= 1 && userTier <= 3 ? NUMBER_TO_TIER[userTier] : null

    const [benefits, setBenefits] = useState<Benefit[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTier, setSelectedTier] = useState<BenefitTier>(userTierKey ?? "trinn1")

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("benefits") })
    }, [navigation, t])

    useEffect(() => {
        let cancelled = false

        fetchBenefits()
            .then(data => {
                if (!cancelled) setBenefits(data)
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const visibleTabs = ALL_TIERS.filter(tier => TIER_TO_NUMBER[tier] <= Math.max(userTier, 1))
    const selectedItems = benefits.filter(
        b => TIER_TO_NUMBER[b.minimumTier] <= TIER_TO_NUMBER[selectedTier],
    )

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="pb-10"
                contentInsetAdjustmentBehavior="automatic"
            >
                {userTierKey ? (
                    <View className="px-4 pt-5 pb-4">
                        <View className="flex-row items-center gap-2">
                            <View className="rounded-full bg-editorial-valid/15 px-3 py-1">
                                <Text className="text-xs font-semibold text-editorial-valid">
                                    {`${TIER_LABELS[userTierKey]} – ${TIER_SUBLABELS[userTierKey]}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="pt-5" />
                )}

                <View className="mx-4 mb-5 flex-row rounded-xl border border-editorial-border bg-text-primary/5 p-1">
                    {visibleTabs.map(tier => {
                        const isSelected = tier === selectedTier
                        const isUserTier = tier === userTierKey
                        return (
                            <Pressable
                                key={tier}
                                className={cn(
                                    "flex-1 rounded-lg px-2 py-2",
                                    isSelected ? "bg-editorial-surface" : "bg-transparent",
                                )}
                                onPress={() => setSelectedTier(tier)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                            >
                                <Text
                                    className={cn(
                                        "text-center text-sm font-semibold",
                                        isSelected ? null : "text-text-secondary",
                                    )}
                                >
                                    {TIER_LABELS[tier]}
                                </Text>
                                {isUserTier ? (
                                    <View className="mt-0.5 items-center">
                                        <View className="h-1 w-1 rounded-full bg-editorial-valid" />
                                    </View>
                                ) : null}
                            </Pressable>
                        )
                    })}
                </View>

                {isLoading ? (
                    <View className="items-center py-16">
                        <ActivityIndicator color={colors.textPrimary} />
                    </View>
                ) : selectedItems.length === 0 ? (
                    <View className="mx-4 items-center gap-2 rounded-2xl border border-editorial-border bg-surface/60 px-6 py-10">
                        <MaterialIcons
                            color={colors.textSecondary}
                            name="card-giftcard"
                            size={32}
                        />
                        <Text className="text-sm text-text-secondary">
                            Ingen fordeler registrert for dette trinnet.
                        </Text>
                    </View>
                ) : (
                    <View className="mx-4 overflow-hidden rounded-2xl border border-editorial-border bg-surface">
                        {selectedItems.map((benefit, index) => (
                            <View
                                key={benefit.id}
                                className={cn(
                                    "px-4 py-4",
                                    index < selectedItems.length - 1
                                        ? "border-b border-editorial-border"
                                        : null,
                                )}
                            >
                                <View className="flex-row items-start gap-3">
                                    <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-editorial-valid/15">
                                        <MaterialIcons
                                            color={colors.editorialValid}
                                            name="check"
                                            size={14}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold leading-5">
                                            {benefit.name}
                                        </Text>
                                        {benefit.description ? (
                                            <Text className="mt-0.5 text-sm leading-5 text-text-secondary">
                                                {benefit.description}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View className="px-4 pt-6">
                    <EtjenestenFooter />
                </View>
            </ScrollView>
        </View>
    )
}
