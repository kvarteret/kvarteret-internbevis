import { MaterialIcons } from "@expo/vector-icons"
import { useIsFocused } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Image,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSession } from "@/app/providers/SessionProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { MenuSheet } from "@/features/dashboard/ui/components/MenuSheet"
import { fetchNowPlaying, NowPlayingState } from "@/features/now-playing/data/nowPlayingRepository"
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
                    <View className="h-full rounded-full bg-link" style={{ width: progressWidth }} />
                </View>
            </View>
        </Card>
    )
}

export const KvarteretScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, isAnonymous, isLoading, logout, exitAnonymousMode } = useSession()
    const { width } = useWindowDimensions()
    const insets = useSafeAreaInsets()
    const isFocused = useIsFocused()

    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    useEffect(() => {
        if (!user && !isAnonymous) {
            router.replace("/login")
        }
    }, [isAnonymous, router, user])

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

    const authAction = user
        ? {
              label: t("logout"),
              icon: "logout" as const,
              destructive: true,
              onPress: () => void logout(),
          }
        : {
              label: t("login"),
              icon: "login" as const,
              onPress: async () => {
                  await exitAnonymousMode()
                  router.replace("/login")
              },
          }

    return (
        <SafeAreaView className="flex-1 bg-background">
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
                    className="items-end"
                    hitSlop={8}
                    onPress={() => setMenuVisible(true)}
                >
                    <Card
                        className="h-10 w-10 items-center justify-center"
                        effect="liquid"
                        variant="grouped"
                    >
                        <MaterialIcons color="#000000" name="menu" size={22} />
                    </Card>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: 6,
                    paddingHorizontal: 8,
                    paddingBottom: Math.max(insets.bottom + 120, 136),
                }}
            >
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
                        onEventPress={eventId => router.push(`/event/${eventId}`)}
                    />
                </View>

                {!user ? (
                    <View className="px-2 pb-4">
                        <Card className="gap-3 px-4 py-4" effect="liquid" variant="grouped">
                            <Text className="text-base text-text-secondary">{t("notRegistered")}</Text>
                            <Button
                                onPress={async () => {
                                    await exitAnonymousMode()
                                    router.replace("/login")
                                }}
                            >
                                <Text className="text-base text-surface font-semibold">
                                    {t("login")}
                                </Text>
                            </Button>
                        </Card>
                    </View>
                ) : null}
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
