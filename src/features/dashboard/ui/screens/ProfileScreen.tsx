import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSession } from "@/app/providers/SessionProvider"
import { getIdVerificationStatus } from "@/features/dashboard/domain/idVerification"
import { buildDisplayRoles, DisplayRoleRow, resolveDisplayedRole } from "@/features/dashboard/domain/profileRoles"
import { MenuSheet } from "@/features/dashboard/ui/components/MenuSheet"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"
import { Text } from "@/shared/ui/Text"

const localImageMap: Record<string, number> = {
    "assets/images/nils.jpg": require("@assets/images/nils.jpg"),
}

interface ScreenHeaderProps {
    headerLogoWidth: number
    homeTitleLabel: string
    openMenuLabel: string
    onOpenMenu: () => void
}

const ScreenHeader = ({
    headerLogoWidth,
    homeTitleLabel,
    openMenuLabel,
    onOpenMenu,
}: ScreenHeaderProps): React.JSX.Element => {
    return (
        <View className="h-18 flex-row items-center px-4 pt-1.5">
            <View className="w-10" />

            <View className="flex-1 items-center px-2">
                <Image
                    accessibilityLabel={homeTitleLabel}
                    resizeMode="contain"
                    source={require("@assets/images/studentersamfunnet-logo.png")}
                    style={{ width: headerLogoWidth, height: 34 }}
                />
            </View>

            <TouchableOpacity
                accessibilityLabel={openMenuLabel}
                className="items-end"
                hitSlop={8}
                onPress={onOpenMenu}
            >
                <Card className="h-10 w-10 items-center justify-center" effect="liquid" variant="grouped">
                    <MaterialIcons color="#000000" name="menu" size={22} />
                </Card>
            </TouchableOpacity>
        </View>
    )
}

interface MemberAvatarProps {
    avatarSize: number
    localImageSource?: number
    remoteImageUrl?: string
}

const MemberAvatar = ({
    avatarSize,
    localImageSource,
    remoteImageUrl,
}: MemberAvatarProps): React.JSX.Element => {
    const hasRemoteImage = Boolean(remoteImageUrl && !localImageSource)

    return (
        <View className="items-center">
            <View
                className="overflow-hidden rounded-full bg-surface-muted"
                style={{ width: avatarSize, height: avatarSize }}
            >
                {localImageSource ? (
                    <Image className="h-full w-full" resizeMode="cover" source={localImageSource} />
                ) : null}

                {!localImageSource && hasRemoteImage ? (
                    <Image className="h-full w-full" resizeMode="cover" source={{ uri: remoteImageUrl }} />
                ) : null}

                {!localImageSource && !hasRemoteImage ? (
                    <View className="h-full w-full items-center justify-center">
                        <MaterialIcons color="#4B5563" name="person" size={140} />
                    </View>
                ) : null}
            </View>
        </View>
    )
}

interface MemberNameProps {
    fullName: string
}

const MemberName = ({ fullName }: MemberNameProps): React.JSX.Element => {
    return (
        <View className="w-full items-center px-2">
            <Text className="text-center text-[44px] leading-[48px] font-black text-text-primary">
                {fullName}
            </Text>
        </View>
    )
}

interface WordOfDayCardProps {
    label: string
    word: string
}

const WordOfDayCard = ({ label, word }: WordOfDayCardProps): React.JSX.Element => {
    return (
        <Card className="w-full gap-2 px-4 py-4" effect="liquid" variant="grouped">
            <View className="gap-1">
                <Text className="text-sm uppercase tracking-wide text-text-secondary font-bold">
                    {label}
                </Text>
                <Text className="text-2xl italic font-semibold text-text-primary">{word}</Text>
            </View>
        </Card>
    )
}

interface RoleCardProps {
    roleLabel: string
    roleName: string
    roleGroup: string
    openProfileDetailsLabel: string
    openProfileDetailsHint: string
    onPress: () => void
}

const RoleCard = ({
    roleLabel,
    roleName,
    roleGroup,
    openProfileDetailsLabel,
    openProfileDetailsHint,
    onPress,
}: RoleCardProps): React.JSX.Element => {
    return (
        <Pressable
            accessibilityHint={openProfileDetailsHint}
            accessibilityLabel={openProfileDetailsLabel}
            accessibilityRole="button"
            className="w-full rounded-2xl border-2 border-[#0F766E] bg-[#0F766E14] px-4 py-3"
            onPress={onPress}
        >
            <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text className="text-xs uppercase tracking-wide text-text-secondary font-bold">
                        {roleLabel}
                    </Text>
                    <Text className="text-xl font-extrabold" numberOfLines={1}>
                        {roleName}
                    </Text>
                    <Text className="text-base text-text-secondary" numberOfLines={1}>
                        {roleGroup}
                    </Text>
                </View>
                <MaterialIcons color="#0F766E" name="chevron-right" size={28} />
            </View>
        </Pressable>
    )
}

interface StatusCardProps {
    tierLabel: string
    isValid: boolean
}

const StatusCard = ({ tierLabel, isValid }: StatusCardProps): React.JSX.Element => {
    return (
        <View
            className="w-full rounded-3xl border px-4 py-5"
            style={{
                backgroundColor: isValid ? "#0B4A0B" : "#8B0000",
                borderColor: isValid ? "#14532D" : "#7F1D1D",
            }}
        >
            <View className="items-center gap-2">
                <Text className="text-3xl text-surface font-black">{tierLabel}</Text>
            </View>
        </View>
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

interface SignedInContentProps {
    userFullName: string
    avatarSize: number
    localImageSource?: number
    remoteImageUrl?: string
    wordOfDayLabel: string
    wordOfDayValue: string
    roleLabel: string
    roleName: string
    roleGroup: string
    openProfileDetailsLabel: string
    openProfileDetailsHint: string
    onOpenRoleModal: () => void
    tierLabel: string
    isValid: boolean
}

const SignedInContent = ({
    userFullName,
    avatarSize,
    localImageSource,
    remoteImageUrl,
    wordOfDayLabel,
    wordOfDayValue,
    roleLabel,
    roleName,
    roleGroup,
    openProfileDetailsLabel,
    openProfileDetailsHint,
    onOpenRoleModal,
    tierLabel,
    isValid,
}: SignedInContentProps): React.JSX.Element => {
    return (
        <>
            <MemberAvatar
                avatarSize={avatarSize}
                localImageSource={localImageSource}
                remoteImageUrl={remoteImageUrl}
            />
            <MemberName fullName={userFullName} />
            <WordOfDayCard label={wordOfDayLabel} word={wordOfDayValue} />
            <RoleCard
                roleLabel={roleLabel}
                roleName={roleName}
                roleGroup={roleGroup}
                openProfileDetailsLabel={openProfileDetailsLabel}
                openProfileDetailsHint={openProfileDetailsHint}
                onPress={onOpenRoleModal}
            />
            <StatusCard tierLabel={tierLabel} isValid={isValid} />
        </>
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
        logout,
        exitAnonymousMode,
    } = useSession()
    const { width } = useWindowDimensions()
    const insets = useSafeAreaInsets()

    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    useEffect(() => {
        if (!user && !isAnonymous) {
            router.replace("/login")
        }
    }, [isAnonymous, router, user])

    const headerLogoWidth = Math.min(280, Math.max(170, width - 120))
    const avatarSize = Math.min(360, Math.max(200, width * 0.5))

    const displayRoles = useMemo(() => (user ? buildDisplayRoles(user) : []), [user])
    const displayedRole = useMemo(
        () => resolveDisplayedRole(displayRoles, selectedFrontpageRoleSelection),
        [displayRoles, selectedFrontpageRoleSelection],
    )

    const authAction: React.ComponentProps<typeof MenuSheet>["authAction"] = user
        ? {
              label: t("logout"),
              icon: "logout",
              destructive: true,
              onPress: () => void logout(),
          }
        : {
              label: t("login"),
              icon: "login",
              onPress: async () => {
                  await exitAnonymousMode()
                  router.replace("/login")
              },
          }

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
                <ActivityIndicator color="#000000" size="large" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScreenHeader
                headerLogoWidth={headerLogoWidth}
                homeTitleLabel={t("homeTitle")}
                openMenuLabel={t("openMenu")}
                onOpenMenu={() => setMenuVisible(true)}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    alignItems: "center",
                    gap: 16,
                    paddingTop: 8,
                    paddingHorizontal: 16,
                    paddingBottom: Math.max(insets.bottom + 120, 136),
                }}
            >
                {user ? (
                    <SignedInContent
                        userFullName={userFullName}
                        avatarSize={avatarSize}
                        localImageSource={localImageSource}
                        remoteImageUrl={remoteImageUrl}
                        wordOfDayLabel={t("wordOfTheDay")}
                        wordOfDayValue={wordOfDayValue}
                        roleLabel={t("kontrollRole")}
                        roleName={roleName}
                        roleGroup={roleGroup}
                        openProfileDetailsLabel={t("openProfileDetails")}
                        openProfileDetailsHint={t("openProfileDetailsHint")}
                        onOpenRoleModal={() => router.push("/profile-roles")}
                        tierLabel={tierLabel}
                        isValid={isValid}
                    />
                ) : (
                    <LoggedOutCard
                        promptText={t("kontrollLoginPrompt")}
                        loginLabel={t("login")}
                        onLoginPress={() => void handleLoginPress()}
                    />
                )}
            </ScrollView>

            <MenuSheet
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                onOpenLanguage={() => setLanguageSelectorVisible(true)}
                onOpenGames={() => router.push("/games")}
                onOpenPrivacy={() => router.push("/privacy")}
                authAction={authAction}
            />

            <LanguageSelectorModal
                visible={languageSelectorVisible}
                onClose={() => setLanguageSelectorVisible(false)}
            />
        </SafeAreaView>
    )
}
