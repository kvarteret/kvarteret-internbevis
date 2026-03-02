import { MaterialIcons } from "@expo/vector-icons"
import { useNavigation, useRouter } from "expo-router"
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, ListRenderItem, Pressable, View } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import {
    buildDisplayRoles,
    DisplayRoleRow,
    resolveDisplayedRole,
    serializeRoleSelection,
} from "@/features/dashboard/domain/profileRoles"
import { MemberHeader } from "@/features/dashboard/ui/components/MemberHeader"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

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
    const { editorialValid } = useThemeRuntimeColors()
    const { user, selectedFrontpageRoleSelection, setSelectedFrontpageRoleSelection } = useSession()
    const displayRoles = useMemo(() => (user ? buildDisplayRoles(user) : []), [user])
    const selectedRole = useMemo(
        () => resolveDisplayedRole(displayRoles, selectedFrontpageRoleSelection),
        [displayRoles, selectedFrontpageRoleSelection],
    )

    useEffect(() => {
        navigation.setOptions({
            title: t("profileRolesTitle"),
        })
    }, [navigation, t])

    useEffect(() => {
        if (!user) {
            if (router.canGoBack()) {
                router.back()
                return
            }

            router.replace("/login")
        }
    }, [router, user])

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

    const selectedRoleKey = selectedRole?.selectionKey ?? null

    const renderRole: ListRenderItem<DisplayRoleRow> = ({ item }) => {
        const isSelected = selectedRoleKey === item.selectionKey
        const hasTier = item.rabattTrinn !== null
        const displayName =
            item.source === "virtual_pingvin" ? t("profileRoleVirtualPingvin") : item.navn

        return (
            <Pressable
                accessibilityLabel={`${item.gruppe} ${displayName}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className="mb-2"
                onPress={() => void setSelectedFrontpageRoleSelection(serializeRoleSelection(item))}
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

                        {isSelected ? (
                            <MaterialIcons
                                accessibilityLabel={t("profileRoleSelected")}
                                color={editorialValid}
                                name="check-circle"
                                size={20}
                            />
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
                        <Text className="px-1 text-lg font-bold">
                            {t("profileMemberInfo")}
                        </Text>

                        <Card className="p-2" effect="liquid" variant="grouped">
                            <MemberHeader
                                animationTrigger={0}
                                firstName={user.fornavn}
                                imageUrl={user.bildeUrl}
                                lastName={user.etternavn}
                                roleGroup={selectedRole?.gruppe ?? ""}
                                roleTitle={
                                    selectedRole?.source === "virtual_pingvin"
                                        ? t("profileRoleVirtualPingvin")
                                        : (selectedRole?.navn ?? "")
                                }
                            />
                        </Card>

                        <Card
                            className="flex-row items-center justify-between px-4 py-4"
                            effect="liquid"
                            variant="grouped"
                        >
                            <Text className="text-base text-text-secondary font-medium">
                                {t("profileTotalPingvinPoeng")}
                            </Text>
                            <Text className="text-2xl font-extrabold">{user.pingvinPoengSum}</Text>
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
                    <View className="pt-4">
                        <EtjenestenFooter />
                    </View>
                }
            />
        </View>
    )
}
