import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Image, Pressable, ScrollView, View } from "react-native"
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSession } from "@/app/providers/SessionProvider"
import { getIdVerificationStatus } from "@/features/dashboard/domain/idVerification"
import { buildDisplayRoles, resolveDisplayedRole } from "@/features/dashboard/domain/profileRoles"
import { DashboardShellLayout } from "@/features/dashboard/ui/components/DashboardShellLayout"
import { themeColors } from "@/shared/theme/colors"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

const localImageMap: Record<string, number> = {
    "assets/images/nils.jpg": require("@assets/images/nils.jpg"),
}

interface IdentityHeroProps {
    fullName: string
    avatarSize: number
    roleName: string
    roleGroup: string
    openProfileDetailsLabel: string
    openProfileDetailsHint: string
    onRolePress: () => void
    localImageSource?: number
    remoteImageUrl?: string
}

const IdentityHero = ({
    fullName,
    avatarSize,
    roleName,
    roleGroup,
    openProfileDetailsLabel,
    openProfileDetailsHint,
    onRolePress,
    localImageSource,
    remoteImageUrl,
}: IdentityHeroProps): React.JSX.Element => {
    const hasRemoteImage = Boolean(remoteImageUrl && !localImageSource)

    return (
        <Card
            className="w-full items-center gap-4 px-4 pb-5 pt-4"
            effect="liquid"
            variant="grouped"
        >
            <View
                className="overflow-hidden rounded-full border border-editorial-border bg-surface-muted"
                style={{ width: avatarSize, height: avatarSize }}
            >
                {localImageSource ? (
                    <Image className="h-full w-full" resizeMode="cover" source={localImageSource} />
                ) : null}

                {!localImageSource && hasRemoteImage ? (
                    <Image
                        className="h-full w-full"
                        resizeMode="cover"
                        source={{ uri: remoteImageUrl }}
                    />
                ) : null}

                {!localImageSource && !hasRemoteImage ? (
                    <View className="h-full w-full items-center justify-center">
                        <MaterialIcons
                            color={themeColors.textSecondary}
                            name="person"
                            size={Math.min(avatarSize * 0.38, 128)}
                        />
                    </View>
                ) : null}
            </View>

            <View className="w-full items-center gap-4 px-2">
                <Text className="text-center text-4xl leading-tight font-black text-editorial-ink">
                    {fullName}
                </Text>

                <Pressable
                    accessibilityHint={openProfileDetailsHint}
                    accessibilityLabel={openProfileDetailsLabel}
                    accessibilityRole="button"
                    className="w-full"
                    onPress={onRolePress}
                >
                    <View className="w-full flex-row items-center justify-between rounded-2xl bg-text-primary/5 px-4 py-3.5">
                        <View className="min-w-0 flex-1 gap-0.5">
                            <Text
                                className="text-xl font-extrabold text-editorial-ink"
                                numberOfLines={1}
                            >
                                {roleName}
                            </Text>
                            <Text className="text-base text-text-secondary" numberOfLines={1}>
                                {roleGroup}
                            </Text>
                        </View>
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-text-primary/10">
                            <MaterialIcons
                                color={themeColors.textSecondary}
                                name="chevron-right"
                                size={24}
                            />
                        </View>
                    </View>
                </Pressable>
            </View>
        </Card>
    )
}

interface VerificationStatusCardProps {
    tierLabel: string
    isValid: boolean
}

const VerificationStatusCard = ({
    tierLabel,
    isValid,
}: VerificationStatusCardProps): React.JSX.Element => {
    return (
        <View
            className="w-full rounded-3xl border px-4 py-5"
            style={{
                backgroundColor: isValid
                    ? themeColors.editorialValid
                    : themeColors.editorialInvalid,
                borderColor: isValid ? themeColors.editorialValid : themeColors.editorialInvalid,
            }}
        >
            <View className="items-center gap-1">
                <Text className="text-4xl leading-tight text-surface font-black">{tierLabel}</Text>
            </View>
        </View>
    )
}

interface SecondaryDetailCardProps {
    label: string
    value: string
}

const SecondaryDetailCard = ({ label, value }: SecondaryDetailCardProps): React.JSX.Element => {
    return (
        <Card className="w-full gap-2 px-4 py-4" effect="liquid" variant="grouped">
            <Text className="text-xs uppercase tracking-wide text-text-secondary font-semibold">
                {label}
            </Text>
            <Text className="text-3xl leading-9 font-semibold text-editorial-ink">{value}</Text>
        </Card>
    )
}

interface LoggedOutCardProps {
    promptText: string
    loginLabel: string
    onLoginPress: () => void
}

const LoggedOutCard = ({
    promptText,
    loginLabel,
    onLoginPress,
}: LoggedOutCardProps): React.JSX.Element => {
    return (
        <Card className="w-full gap-4 px-4 py-5" effect="liquid" variant="grouped">
            <Text className="text-base text-text-secondary">{promptText}</Text>
            <Button onPress={onLoginPress}>
                <Text className="text-base text-surface font-semibold">{loginLabel}</Text>
            </Button>
        </Card>
    )
}

export const ProfileScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const {
        user,
        isAnonymous,
        selectedFrontpageRoleSelection,
        isLoading,
        exitAnonymousMode,
    } = useSession()
    const frame = useSafeAreaFrame()
    const insets = useSafeAreaInsets()

    useEffect(() => {
        if (!user && !isAnonymous) {
            router.replace("/login")
        }
    }, [isAnonymous, router, user])

    const avatarSize = Math.min(340, Math.max(180, frame.width * 0.46))

    const displayRoles = useMemo(() => (user ? buildDisplayRoles(user) : []), [user])
    const displayedRole = useMemo(
        () => resolveDisplayedRole(displayRoles, selectedFrontpageRoleSelection),
        [displayRoles, selectedFrontpageRoleSelection],
    )

    const handleLoginPress = async (): Promise<void> => {
        await exitAnonymousMode()
        router.replace("/login")
    }

    const roleName = (() => {
        if (!displayedRole) return "-"
        return displayedRole.source === "virtual_pingvin"
            ? t("profileRoleVirtualPingvin")
            : displayedRole.navn
    })()

    const roleGroup = displayedRole?.gruppe ?? "-"
    const userFullName = user ? `${user.fornavn} ${user.etternavn}`.trim() || "-" : "-"
    const wordOfDayValue = user?.dagensOrd.trim() || "-"

    const status = user ? getIdVerificationStatus(user) : null
    const isValid = status?.isValid ?? false
    const tierLabel = t("tierLabel", { tier: status?.tier ?? 0 })

    const localImageSource = user?.bildeUrl ? localImageMap[user.bildeUrl] : undefined
    const remoteImageUrl = user?.bildeUrl

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator color={themeColors.textPrimary} size="large" />
            </SafeAreaView>
        )
    }

    return (
        <DashboardShellLayout>
            <ScrollView
                className="flex-1"
                contentInsetAdjustmentBehavior="always"
                contentContainerStyle={{
                    gap: 14,
                    paddingTop: 6,
                    paddingHorizontal: 16,
                    paddingBottom: Math.max(insets.bottom + 120, 136),
                }}
            >
                {user ? (
                    <>
                        <IdentityHero
                            fullName={userFullName}
                            avatarSize={avatarSize}
                            roleName={roleName}
                            roleGroup={roleGroup}
                            openProfileDetailsLabel={t("openProfileDetails")}
                            openProfileDetailsHint={t("openProfileDetailsHint")}
                            onRolePress={() => router.push("/profile-roles")}
                            localImageSource={localImageSource}
                            remoteImageUrl={remoteImageUrl}
                        />

                        <VerificationStatusCard tierLabel={tierLabel} isValid={isValid} />

                        <SecondaryDetailCard label={t("wordOfTheDay")} value={wordOfDayValue} />
                    </>
                ) : (
                    <LoggedOutCard
                        promptText={t("kontrollLoginPrompt")}
                        loginLabel={t("login")}
                        onLoginPress={() => void handleLoginPress()}
                    />
                )}

                <EtjenestenFooter />
            </ScrollView>
        </DashboardShellLayout>
    )
}
