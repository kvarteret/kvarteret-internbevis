import { useIsFocused } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Image,
    ScrollView,
    View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSession } from "@/app/providers/SessionProvider"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { MenuSheet } from "@/features/dashboard/ui/components/MenuSheet"
import { TopShellHeader } from "@/features/dashboard/ui/components/TopShellHeader"
import { fetchNowPlaying, NowPlayingState } from "@/features/now-playing/data/nowPlayingRepository"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { themeColors } from "@/shared/theme/colors"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"
import { Text } from "@/shared/ui/Text"

const NOW_PLAYING_POLL_INTERVAL_MS = 10_000

const clampProgress = (value: number | null): number => {
    if (value === null || !Number.isFinite(value)) return 0
    return Math.min(100, Math.max(0, value))
}

interface OpeningStatusHeroProps {
    title: string
    nowPlaying: NowPlayingState | null
    progressWidth: `${number}%`
}

const OpeningStatusHero = ({
    title,
    nowPlaying,
    progressWidth,
}: OpeningStatusHeroProps): React.JSX.Element => {
    return (
        <Card
            className="w-full gap-3 rounded-3xl bg-editorial-surface px-4 py-4"
            effect="liquid"
            variant="grouped"
        >
            <Text className="text-3xl leading-tight text-editorial-ink font-black">{title}</Text>
            {nowPlaying ? <NowPlayingWidget nowPlaying={nowPlaying} progressWidth={progressWidth} /> : null}
        </Card>
    )
}

interface SectionHeaderProps {
    eyebrow: string
    title: string
}

const SectionHeader = ({ eyebrow, title }: SectionHeaderProps): React.JSX.Element => {
    return (
        <View className="w-full gap-0.5 px-1">
            <Text className="text-xs uppercase tracking-wide text-text-muted font-semibold">
                {eyebrow}
            </Text>
            <Text className="text-2xl leading-8 text-editorial-ink font-black">{title}</Text>
        </View>
    )
}

interface NowPlayingWidgetProps {
    nowPlaying: NowPlayingState
    progressWidth: `${number}%`
}

const NowPlayingWidget = ({
    nowPlaying,
    progressWidth,
}: NowPlayingWidgetProps): React.JSX.Element => {
    return (
        <View className="w-full flex-row items-center gap-3 pt-3">
            {nowPlaying.image ? (
                <Image className="h-16 w-16 rounded-lg" source={{ uri: nowPlaying.image }} />
            ) : (
                <View className="h-16 w-16 rounded-lg bg-surface-muted" />
            )}
            <View className="flex-1 gap-1.5">
                <Text className="text-base text-editorial-ink font-extrabold" ellipsizeMode="tail" numberOfLines={1}>
                    {nowPlaying.name ?? "-"}
                </Text>
                <Text className="text-sm text-editorial-ink-soft" ellipsizeMode="tail" numberOfLines={1}>
                    {nowPlaying.artists ?? "-"}
                    {nowPlaying.album ? ` - ${nowPlaying.album}` : ""}
                </Text>
                <View className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                    <View className="h-full rounded-full bg-editorial-valid" style={{ width: progressWidth }} />
                </View>
            </View>
        </View>
    )
}

export const KvarteretScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, isAnonymous, isLoading, logout, exitAnonymousMode } = useSession()
    const insets = useSafeAreaInsets()
    const isFocused = useIsFocused()

    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    useEffect(() => {
        if (!user && !isAnonymous) {
            router.replace("/login")
        }
    }, [isAnonymous, router, user])

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

    const isVenueOpen = true

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator color={themeColors.textPrimary} size="large" />
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
            <TopShellHeader
                openMenuLabel={t("openMenu")}
                onOpenMenu={() => setMenuVisible(true)}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    gap: 24,
                    paddingTop: 10,
                    paddingHorizontal: 16,
                    paddingBottom: Math.max(insets.bottom + 120, 136),
                }}
            >
                <OpeningStatusHero
                    title={isVenueOpen ? t("kvarteretOpenStatusTitle") : t("kvarteretClosed")}
                    nowPlaying={showNowPlayingWidget && nowPlaying ? nowPlaying : null}
                    progressWidth={nowPlayingProgressWidth}
                />

                {!user ? (
                    <Card
                        className="w-full gap-3 border border-editorial-border bg-editorial-surface px-4 py-4"
                        effect="liquid"
                        variant="grouped"
                    >
                        <Text className="text-base text-editorial-ink-soft">{t("notRegistered")}</Text>
                        <Button
                            onPress={async () => {
                                await exitAnonymousMode()
                                router.replace("/login")
                            }}
                        >
                            <Text className="text-base text-surface font-semibold">{t("login")}</Text>
                        </Button>
                    </Card>
                ) : null}

                <View className="w-full gap-3">
                    <SectionHeader eyebrow={t("kvarteretEventsEyebrow")} title={t("homeEventsTitle")} />
                    <EventCarousel
                        events={events}
                        isPending={eventsPending}
                        isError={eventsError}
                        onRetry={async () => refetchEvents()}
                        onEventPress={eventId => router.push(`/event/${eventId}`)}
                        showTitle={false}
                    />
                </View>

                <EtjenestenFooter />
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
