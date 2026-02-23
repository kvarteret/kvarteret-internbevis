import { MaterialIcons } from "@expo/vector-icons"
import { useIsFocused } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Image,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { useSession } from "@/app/providers/SessionProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { MemberHeader } from "@/features/dashboard/ui/components/MemberHeader"
import { MemberStatusCard } from "@/features/dashboard/ui/components/MemberStatusCard"
import { MenuSheet } from "@/features/dashboard/ui/components/MenuSheet"
import { NowPlayingState, fetchNowPlaying } from "@/features/now-playing/data/nowPlayingRepository"
import { getHighestTierGroup, getHighestTierName } from "@/shared/types/user"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"
import { Text } from "@/shared/ui/Text"

const NOW_PLAYING_POLL_INTERVAL_MS = 10_000

const clampProgress = (value: number | null): number => {
    if (value === null || !Number.isFinite(value)) return 0
    return Math.min(100, Math.max(0, value))
}

interface NowPlayingWidgetProps {
    nowPlaying: NowPlayingState
    progressWidth: `${number}%`
}

const NowPlayingWidget = ({
    nowPlaying,
    progressWidth,
}: NowPlayingWidgetProps): React.JSX.Element => {
    const { t } = useTranslation()
    return (
        <Card className="flex-row items-center gap-3 p-3">
            {nowPlaying.image ? (
                <Image className="h-16 w-16 rounded-lg" source={{ uri: nowPlaying.image }} />
            ) : null}
            <View className="flex-1 gap-1.5">
                <Text className="text-xs uppercase text-text-secondary font-semibold">
                    {t("nowPlayingPlaying")}
                </Text>
                <Text className="text-base font-semibold" ellipsizeMode="tail" numberOfLines={1}>
                    {nowPlaying.name ?? "-"}
                </Text>
                <Text
                    className="text-sm text-text-secondary"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                >
                    {nowPlaying.artists ?? "-"}
                    {nowPlaying.album ? ` - ${nowPlaying.album}` : ""}
                </Text>
                <View className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <View
                        className="h-full rounded-full bg-link"
                        style={{ width: progressWidth }}
                    />
                </View>
            </View>
        </Card>
    )
}

export const HomeScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Home">): React.JSX.Element => {
    const { t } = useTranslation()
    const { user, isLoading, logout } = useSession()
    const { height, width } = useWindowDimensions()
    const isFocused = useIsFocused()

    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)
    const [animationTrigger, setAnimationTrigger] = useState(0)

    const isSmallScreen = height < 600
    const headerLogoWidth = Math.min(280, Math.max(170, width - 120))

    const {
        data: events,
        isPending: eventsPending,
        isError: eventsError,
        refetch: refetchEvents,
    } = useQuery({
        queryKey: ["home-events"],
        queryFn: ({ signal }) => fetchHomeEvents(signal),
        staleTime: 30_000,
        retry: 1,
    })

    const { data: nowPlaying, isError: nowPlayingError } = useQuery({
        queryKey: ["home-now-playing"],
        queryFn: ({ signal }) => fetchNowPlaying(signal),
        enabled: isFocused,
        refetchInterval: isFocused ? NOW_PLAYING_POLL_INTERVAL_MS : false,
        refetchIntervalInBackground: false,
        staleTime: 5_000,
        retry: 1,
    })

    const showNowPlayingWidget = Boolean(
        nowPlaying &&
            !nowPlayingError &&
            nowPlaying.authorized &&
            nowPlaying.hasTrack &&
            nowPlaying.isPlaybackActive,
    )
    const nowPlayingProgressWidth =
        `${clampProgress(nowPlaying?.progressPercent ?? 0)}%` as `${number}%`

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator color="#000000" size="large" />
            </SafeAreaView>
        )
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center px-4">
                <Text className="text-lg font-medium">{t("notRegistered")}</Text>
                <View className="mt-4 w-56">
                    <Button onPress={() => void logout()}>
                        <Text className="text-base leading-5 text-surface font-semibold">
                            {t("logout")}
                        </Text>
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1">
            <View className="h-18 flex-row items-center px-4 pt-1.5">
                <View className="w-10" />

                <View className="flex-1 items-center px-2">
                    <Image
                        accessibilityLabel={t("homeTitle")}
                        resizeMode="contain"
                        source={require("@assets/images/studentersamfunnet-logo.png")}
                        style={{ width: headerLogoWidth, height: 34 }}
                    />
                </View>

                <TouchableOpacity
                    accessibilityLabel={t("openMenu")}
                    className="w-10 items-end"
                    onPress={() => setMenuVisible(true)}
                >
                    <MaterialIcons color="#000000" name="menu" size={28} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerClassName="px-2 pb-20 pt-1.5">
                <View className={isSmallScreen ? "pb-2" : "pb-4"}>
                    <View className="items-center pb-2">
                        <MemberHeader
                            animationTrigger={animationTrigger}
                            imageUrl={user.bildeUrl}
                            firstName={user.fornavn}
                            lastName={user.etternavn}
                            roleGroup={getHighestTierGroup(user)}
                            roleTitle={getHighestTierName(user)}
                            wordOfTheDay={user.dagensOrd.trim() || "-"}
                        />
                    </View>

                    <View className="justify-center pb-2 pt-3">
                        <MemberStatusCard
                            user={user}
                            onBadgePress={() => setAnimationTrigger(previous => previous + 1)}
                        />
                    </View>
                </View>

                {showNowPlayingWidget && nowPlaying ? (
                    <View className="px-2 pb-4">
                        <NowPlayingWidget
                            nowPlaying={nowPlaying}
                            progressWidth={nowPlayingProgressWidth}
                        />
                    </View>
                ) : null}

                <View className="px-2 pb-4">
                    <EventCarousel
                        events={events}
                        isPending={eventsPending}
                        isError={eventsError}
                        onRetry={async () => refetchEvents()}
                        onEventPress={eventId => navigation.navigate("EventDetails", { eventId })}
                    />
                </View>
            </ScrollView>

            <View className="w-full items-center justify-center pb-4 pt-2">
                <View className="w-full flex-row flex-nowrap items-center justify-center px-3">
                    <Text
                        adjustsFontSizeToFit
                        className="shrink text-lg leading-6 font-medium"
                        ellipsizeMode="tail"
                        minimumFontScale={0.72}
                        numberOfLines={1}
                    >
                        {t("homeFooterPrefix")}
                    </Text>
                    <Text className="px-1.5 text-2xl leading-8" numberOfLines={1}>
                        |
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="link"
                        className="shrink"
                        onPress={() => void openExternalUrl("https://blifrivillig.no")}
                    >
                        <Text
                            adjustsFontSizeToFit
                            className="text-lg leading-6 underline font-extrabold"
                            ellipsizeMode="tail"
                            minimumFontScale={0.72}
                            numberOfLines={1}
                        >
                            {t("homeFooterVolunteer")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <MenuSheet
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                onOpenLanguage={() => setLanguageSelectorVisible(true)}
                onOpenGames={() => navigation.navigate("Games")}
                onOpenPrivacy={() => navigation.navigate("Privacy")}
                onLogout={() => void logout()}
            />

            <LanguageSelectorModal
                visible={languageSelectorVisible}
                onClose={() => setLanguageSelectorVisible(false)}
            />
        </SafeAreaView>
    )
}
