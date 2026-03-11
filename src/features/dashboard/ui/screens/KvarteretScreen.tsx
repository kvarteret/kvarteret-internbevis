import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, ScrollView, View } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import { shouldShowGrondahlsStatusCard } from "@/features/dashboard/domain/grondahlsOpening"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"
import { splitHomeEventsByType } from "@/features/dashboard/domain/eventSelection"
import { DashboardShellLayout } from "@/features/dashboard/ui/components/DashboardShellLayout"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { fetchNowPlaying, NowPlayingState } from "@/features/now-playing/data/nowPlayingRepository"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
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
            {nowPlaying ? (
                <NowPlayingWidget nowPlaying={nowPlaying} progressWidth={progressWidth} />
            ) : null}
        </Card>
    )
}

interface EventSectionProps {
    title: string
    events: FirestoreEventDocument[]
    onRetry: () => Promise<unknown>
    onEventPress: (eventId: string) => void
}

const EventSection = ({
    title,
    events,
    onRetry,
    onEventPress,
}: EventSectionProps): React.JSX.Element => {
    return (
        <View className="w-full gap-2.5">
            <Text className="px-1 text-2xl leading-8 text-editorial-ink font-black">{title}</Text>
            <EventCarousel
                events={events}
                isPending={false}
                isError={false}
                onRetry={onRetry}
                onEventPress={onEventPress}
                showTitle={false}
            />
        </View>
    )
}

const EVENT_SECTION_CONFIG = [
    {
        key: "debates",
        titleKey: "homeEventsDebatesTitle",
    },
    {
        key: "concerts",
        titleKey: "homeEventsConcertsTitle",
    },
    {
        key: "others",
        titleKey: "homeEventsOtherTitle",
    },
] as const

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
                <CachedImage
                    className="h-16 w-16 rounded-lg"
                    contentFit="cover"
                    source={nowPlaying.image}
                />
            ) : (
                <View className="h-16 w-16 rounded-lg bg-surface-muted" />
            )}
            <View className="flex-1 gap-1.5">
                <Text
                    className="text-base text-editorial-ink font-extrabold"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                >
                    {nowPlaying.name ?? "-"}
                </Text>
                <Text
                    className="text-sm text-editorial-ink-soft"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                >
                    {nowPlaying.artists ?? "-"}
                    {nowPlaying.album ? ` - ${nowPlaying.album}` : ""}
                </Text>
                <View className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                    <View
                        className="h-full rounded-full bg-editorial-valid"
                        style={{ width: progressWidth }}
                    />
                </View>
            </View>
        </View>
    )
}

export const KvarteretScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, isAnonymous, hasStoredCredentials, isLoading } = useSession()
    const isFocused = useIsFocused()
    const { textPrimary } = useThemeRuntimeColors()

    useEffect(() => {
        if (!user && !isAnonymous && !hasStoredCredentials) {
            router.replace("/login")
        }
    }, [hasStoredCredentials, isAnonymous, router, user])

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

    const showNowPlayingWidget = !nowPlayingError && shouldShowGrondahlsStatusCard(nowPlaying)
    const nowPlayingProgressWidth =
        `${clampProgress(nowPlaying?.progressPercent ?? 0)}%` as `${number}%`

    const isVenueOpen = showNowPlayingWidget
    const groupedEvents = useMemo(() => splitHomeEventsByType(events ?? []), [events])
    const renderedEventSections = useMemo(() => {
        return EVENT_SECTION_CONFIG.map(section => ({
            ...section,
            events: groupedEvents[section.key],
        }))
            .filter(section => section.events.length > 0)
            .map(section => (
                <EventSection
                    key={section.key}
                    events={section.events}
                    title={t(section.titleKey)}
                    onRetry={async () => refetchEvents()}
                    onEventPress={eventId => router.push(`/event/${eventId}`)}
                />
            ))
    }, [groupedEvents, refetchEvents, router, t])

    if (isLoading) {
        return (
            <DashboardShellLayout>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={textPrimary} size="large" />
                </View>
            </DashboardShellLayout>
        )
    }

    return (
        <DashboardShellLayout>
            <ScrollView
                className="flex-1"
                contentInsetAdjustmentBehavior="automatic"
                contentContainerClassName="gap-6 px-4 pb-36 pt-2.5"
            >
                {isVenueOpen ? (
                    <OpeningStatusHero
                        title={t("kvarteretOpenStatusTitle")}
                        nowPlaying={showNowPlayingWidget && nowPlaying ? nowPlaying : null}
                        progressWidth={nowPlayingProgressWidth}
                    />
                ) : null}

                <View className="w-full gap-3">
                    {eventsPending || eventsError ? (
                        <EventCarousel
                            events={events}
                            isPending={eventsPending}
                            isError={eventsError}
                            onRetry={async () => refetchEvents()}
                            onEventPress={eventId => router.push(`/event/${eventId}`)}
                            showTitle={false}
                        />
                    ) : (
                        <View className="w-full gap-5">
                            {renderedEventSections.length > 0 ? (
                                renderedEventSections
                            ) : (
                                <Text className="text-sm text-text-secondary">
                                    {t("homeEventsEmpty")}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                <EtjenestenFooter />
            </ScrollView>
        </DashboardShellLayout>
    )
}
