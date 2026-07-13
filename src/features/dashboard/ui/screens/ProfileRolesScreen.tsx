import { useNavigation, useRouter } from "expo-router"
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, ListRenderItem, Pressable, View } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import {
    buildDisplayRoles,
    buildVolunteerHistoryRows,
    DisplayRoleRow,
    resolvePersistedRoleSelections,
    serializeRoleSelections,
    toggleFrontPageRoleSelection,
    VolunteerHistoryRow,
} from "@/features/dashboard/domain/profileRoles"
import { MemberHeader } from "@/features/dashboard/ui/components/MemberHeader"
import { SelectedFrontpageRolesGrid } from "@/features/dashboard/ui/components/SelectedFrontpageRolesGrid"
import { useFrontpageRoles } from "@/features/dashboard/ui/FrontpageRolesProvider"
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

const historyDateFormatter = new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
})

const formatHistoryDate = (value: string | null): string | null => {
    if (!value) {
        return null
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return null
    }

    return historyDateFormatter.format(parsed)
}

const formatHistoryPeriod = (
    role: VolunteerHistoryRow,
    activeLabel: string,
    unknownLabel: string,
): string => {
    if (role.aktiv) {
        return activeLabel
    }

    const startDate = formatHistoryDate(role.startet)
    const endDate = formatHistoryDate(role.sluttet)
    if (startDate || endDate) {
        return `${startDate ?? "?"} - ${endDate ?? "?"}`
    }

    if (role.semester && role.ar) {
        return `${role.semester} ${role.ar}`
    }

    if (role.ar) {
        return String(role.ar)
    }

    return unknownLabel
}

interface VolunteerHistorySectionProps {
    rows: VolunteerHistoryRow[]
    emptyLabel: string
    getPeriodLabel: (role: VolunteerHistoryRow) => string
    tierLabel: (tier: number) => string
    title: string
}

const VolunteerHistorySection = ({
    rows,
    emptyLabel,
    getPeriodLabel,
    tierLabel,
    title,
}: VolunteerHistorySectionProps): React.JSX.Element => (
    <View className="gap-2">
        <Text className="px-1 pt-1 text-lg font-bold">{title}</Text>
        {rows.length > 0 ? (
            <View className="gap-2">
                {rows.map((role, index) => (
                    <Card
                        className="flex-row items-center justify-between gap-3 px-4 py-3"
                        effect="liquid"
                        key={`${role.gruppe}:${role.navn}:${role.ar ?? "year"}:${role.semester ?? "term"}:${role.sluttet ?? "end"}:${index}`}
                        variant="grouped"
                    >
                        <View className="min-w-0 flex-1">
                            <Text className="text-base font-semibold" numberOfLines={1}>
                                {role.navn}
                            </Text>
                            <Text className="text-sm text-text-secondary" numberOfLines={1}>
                                {role.gruppe}
                            </Text>
                        </View>
                        <View className="items-end gap-1">
                            <Text className="text-sm font-semibold text-text-secondary">
                                {getPeriodLabel(role)}
                            </Text>
                            <View
                                className={cn(
                                    "rounded-full px-3 py-1",
                                    getTierBadgeClass(role.rabattTrinn),
                                )}
                            >
                                <Text
                                    className={cn(
                                        "text-xs font-bold",
                                        role.rabattTrinn === null
                                            ? "text-text-secondary"
                                            : "text-surface",
                                    )}
                                >
                                    {role.rabattTrinn === null ? "-" : tierLabel(role.rabattTrinn)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))}
            </View>
        ) : (
            <Card className="px-4 py-5" effect="liquid" variant="grouped">
                <Text className="text-base text-text-secondary">{emptyLabel}</Text>
            </Card>
        )}
    </View>
)

export const ProfileRolesScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const router = useRouter()
    const { editorialValid } = useThemeRuntimeColors()
    const { user, status } = useSession()
    const { selectedFrontpageRoleSelections, setSelectedFrontpageRoleSelections } =
        useFrontpageRoles()

    const displayRoles = useMemo(() => (user ? buildDisplayRoles(user) : []), [user])
    const volunteerHistoryRows = useMemo(
        () => (user ? buildVolunteerHistoryRows(user) : []),
        [user],
    )
    const selectedRoles = useMemo(
        () => resolvePersistedRoleSelections(displayRoles, selectedFrontpageRoleSelections),
        [displayRoles, selectedFrontpageRoleSelections],
    )
    const selectedOrderByKey = useMemo(
        () => new Map(selectedRoles.map((role, index) => [role.selectionKey, index + 1] as const)),
        [selectedRoles],
    )
    useEffect(() => {
        navigation.setOptions({
            title: t("profileRolesTitle"),
        })
    }, [navigation, t])

    useEffect(() => {
        if (status === "signedOut" || status === "anonymous") {
            if (router.canGoBack()) {
                router.back()
                return
            }

            router.replace("/login")
        }
    }, [router, status])

    const getRoleTitle = (role: DisplayRoleRow): string =>
        role.source === "virtual_pingvin" ? t("profileRoleVirtualPingvin") : role.navn
    const getVolunteerHistoryPeriod = (role: VolunteerHistoryRow): string =>
        formatHistoryPeriod(role, t("profileRoleHistoryActive"), t("profileRoleHistoryUnknown"))

    const handleRolePress = async (role: DisplayRoleRow): Promise<void> => {
        const result = toggleFrontPageRoleSelection(
            displayRoles,
            serializeRoleSelections(selectedRoles),
            role,
        )

        switch (result.action) {
            case "added":
            case "removed":
                await triggerSelectionHaptic()
                await setSelectedFrontpageRoleSelections(result.nextSelections)
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
                    <View className="gap-3 pt-4">
                        <VolunteerHistorySection
                            emptyLabel={t("profileNoRoleHistory")}
                            getPeriodLabel={getVolunteerHistoryPeriod}
                            rows={volunteerHistoryRows}
                            tierLabel={tier => t("tierLabel", { tier })}
                            title={t("profileRoleHistory")}
                        />
                        <EtjenestenFooter />
                    </View>
                }
            />
        </View>
    )
}
