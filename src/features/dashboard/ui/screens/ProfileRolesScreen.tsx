import { useNavigation, useRouter } from "expo-router"
import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, ListRenderItem, Pressable, View } from "react-native"
import { useAppAnalytics } from "@/app/providers/AppAnalyticsProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { ANALYTICS_EVENT } from "@/features/analytics/domain/analytics"
import {
    getMembershipBenefitTranslationKeys,
    MembershipBenefitTier,
    resolveInitialMembershipBenefitTier,
} from "@/features/dashboard/domain/membershipBenefits"
import {
    buildDisplayRoles,
    DisplayRoleRow,
    resolvePersistedRoleSelections,
    serializeRoleSelections,
    toggleFrontPageRoleSelection,
} from "@/features/dashboard/domain/profileRoles"
import { MemberHeader } from "@/features/dashboard/ui/components/MemberHeader"
import { MembershipBenefitsCard } from "@/features/dashboard/ui/components/MembershipBenefitsCard"
import { SelectedFrontpageRolesGrid } from "@/features/dashboard/ui/components/SelectedFrontpageRolesGrid"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"
import { triggerSelectionHaptic, triggerSoftImpactHaptic } from "@/shared/utils/haptics"

const getTierBadgeClass = (tier: number | null): string => {
    if (tier === null) {
        return "border border-border bg-surface"
    }

    switch (tier) {
        case 1:
            return "bg-state-success"
        case 2:
            return "bg-state-warning"
        case 3:
            return "bg-editorial-valid"
        default:
            return "bg-state-info"
    }
}

export const ProfileRolesScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const router = useRouter()
    const { track } = useAppAnalytics()
    const { editorialValid } = useThemeRuntimeColors()
    const {
        user,
        hasStoredCredentials,
        selectedFrontpageRoleSelections,
        setSelectedFrontpageRoleSelections,
    } = useSession()

    const displayRoles = useMemo(() => (user ? buildDisplayRoles(user) : []), [user])
    const selectedRoles = useMemo(
        () => resolvePersistedRoleSelections(displayRoles, selectedFrontpageRoleSelections),
        [displayRoles, selectedFrontpageRoleSelections],
    )
    const defaultMembershipBenefitsTier = useMemo(
        () => resolveInitialMembershipBenefitTier(user),
        [user],
    )
    const [selectedMembershipBenefitsTier, setSelectedMembershipBenefitsTier] =
        useState<MembershipBenefitTier | null>(defaultMembershipBenefitsTier)
    const selectedOrderByKey = useMemo(
        () => new Map(selectedRoles.map((role, index) => [role.selectionKey, index + 1] as const)),
        [selectedRoles],
    )
    const selectedMembershipBenefitLabels = useMemo(() => {
        if (selectedMembershipBenefitsTier === null) {
            return []
        }

        return getMembershipBenefitTranslationKeys(selectedMembershipBenefitsTier).map(key =>
            t(key),
        )
    }, [selectedMembershipBenefitsTier, t])

    useEffect(() => {
        navigation.setOptions({
            title: t("profileRolesTitle"),
        })
    }, [navigation, t])

    useEffect(() => {
        if (!user && !hasStoredCredentials) {
            if (router.canGoBack()) {
                router.back()
                return
            }

            router.replace("/login")
        }
    }, [hasStoredCredentials, router, user])

    useEffect(() => {
        setSelectedMembershipBenefitsTier(defaultMembershipBenefitsTier)
    }, [defaultMembershipBenefitsTier])

    const getRoleTitle = (role: DisplayRoleRow): string =>
        role.source === "virtual_pingvin" ? t("profileRoleVirtualPingvin") : role.navn

    const handleRolePress = async (role: DisplayRoleRow): Promise<void> => {
        const result = toggleFrontPageRoleSelection(
            displayRoles,
            serializeRoleSelections(selectedRoles),
            role,
        )

        switch (result.action) {
            case "added":
            case "removed":
                const nextSelectedRoles = resolvePersistedRoleSelections(
                    displayRoles,
                    result.nextSelections,
                )
                await triggerSelectionHaptic()
                await setSelectedFrontpageRoleSelections(result.nextSelections)
                track(ANALYTICS_EVENT.profileRolesUpdated, {
                    primary_role_group: nextSelectedRoles[0]?.gruppe ?? null,
                    primary_role_name: nextSelectedRoles[0]
                        ? getRoleTitle(nextSelectedRoles[0])
                        : null,
                    role_groups: nextSelectedRoles.map(nextRole => nextRole.gruppe),
                    role_names: nextSelectedRoles.map(nextRole => getRoleTitle(nextRole)),
                    role_selection_count: nextSelectedRoles.length,
                })
                return
            case "blocked_max":
                await triggerSoftImpactHaptic()
                return
        }
    }

    if (!user) {
        return (
            <View className="flex-1 items-center justify-center bg-background px-4">
                <Text className="text-base text-text-secondary">{t("notRegistered")}</Text>
                <View className="absolute inset-x-0 bottom-0">
                    <EtjenestenFooter />
                </View>
            </View>
        )
    }

    const primarySelectedRole = selectedRoles[0] ?? null

    const renderRole: ListRenderItem<DisplayRoleRow> = ({ item }) => {
        const selectionOrder = selectedOrderByKey.get(item.selectionKey) ?? null
        const isSelected = selectionOrder !== null
        const hasTier = item.rabattTrinn !== null
        const displayName = getRoleTitle(item)

        return (
            <Pressable
                accessibilityLabel={`${item.gruppe} ${displayName}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className="mb-2"
                onPress={() => void handleRolePress(item)}
            >
                <Card
                    className={cn(
                        "flex-row items-center justify-between gap-3 px-4 py-3",
                        isSelected ? "border-2 border-link bg-surface/80" : null,
                    )}
                    effect="liquid"
                    variant="grouped"
                >
                    <View className="min-w-0 flex-1">
                        <Text className="text-base font-semibold" numberOfLines={1}>
                            {displayName}
                        </Text>
                        <Text className="text-sm text-text-secondary" numberOfLines={1}>
                            {item.gruppe}
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <View
                            className={cn(
                                "rounded-full px-3 py-1",
                                getTierBadgeClass(item.rabattTrinn),
                            )}
                        >
                            <Text
                                className={cn(
                                    "text-xs font-bold",
                                    hasTier ? "text-surface" : "text-text-secondary",
                                )}
                            >
                                {hasTier ? t("tierLabel", { tier: item.rabattTrinn }) : "-"}
                            </Text>
                        </View>

                        {selectionOrder ? (
                            <View
                                className="h-7 w-7 items-center justify-center rounded-full"
                                style={{ backgroundColor: editorialValid }}
                            >
                                <Text className="text-xs font-black text-surface">
                                    {selectionOrder}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </Card>
            </Pressable>
        )
    }

    return (
        <View className="flex-1 bg-background">
            <FlatList
                className="flex-1"
                contentInsetAdjustmentBehavior="automatic"
                contentContainerClassName="px-3 py-3 pb-6"
                data={displayRoles}
                keyExtractor={(item, index) => `${item.selectionKey}:${index}`}
                renderItem={renderRole}
                ListHeaderComponent={
                    <View className="mb-3 gap-3">
                        <Text className="px-1 text-lg font-bold">{t("profileMemberInfo")}</Text>

                        <Card className="p-2" effect="liquid" variant="grouped">
                            <MemberHeader
                                animationTrigger={0}
                                firstName={user.fornavn}
                                imageUrl={user.bildeUrl}
                                lastName={user.etternavn}
                                roleGroup={primarySelectedRole?.gruppe ?? ""}
                                roleTitle={
                                    primarySelectedRole ? getRoleTitle(primarySelectedRole) : ""
                                }
                            />
                        </Card>

                        <Card
                            className="flex-row items-center justify-between px-4 py-4"
                            effect="liquid"
                            variant="grouped"
                        >
                            <Text className="text-base font-medium text-text-secondary">
                                {t("profileTotalPingvinPoeng")}
                            </Text>
                            <Text className="text-2xl font-extrabold">{user.pingvinPoengSum}</Text>
                        </Card>

                        <Card className="gap-3 px-4 py-4" effect="liquid" variant="grouped">
                            <SelectedFrontpageRolesGrid
                                compact
                                getRoleTitle={getRoleTitle}
                                reserveMaxHeight
                                roles={selectedRoles}
                                showOrderBadge
                            />
                        </Card>

                        <MembershipBenefitsCard
                            benefitLabels={selectedMembershipBenefitLabels}
                            description={t("profileMembershipBenefitsDescription")}
                            onSelectTier={setSelectedMembershipBenefitsTier}
                            selectedTier={selectedMembershipBenefitsTier}
                            tierLabel={tier => t("tierLabel", { tier })}
                            title={t("profileMembershipBenefitsTitle")}
                        />

                        <Text className="px-1 pt-1 text-lg font-bold">
                            {t("profileActiveRoles")}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <Card className="px-4 py-5" effect="liquid" variant="grouped">
                        <Text className="text-base text-text-secondary">
                            {t("profileNoActiveRoles")}
                        </Text>
                    </Card>
                }
                ListFooterComponent={
                    <View className="pt-4">
                        <EtjenestenFooter />
                    </View>
                }
            />
        </View>
    )
}
