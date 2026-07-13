import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, ScrollView, View } from "react-native"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import { fetchNowPlaying } from "@/features/dashboard/data/nowPlayingRepository"
import {
    buildEventFeedSections,
    countActiveEventFilters,
    createEmptyEventFilterState,
    deriveTaxonomyFromEvents,
    EventFilterState,
    filterEvents,
    parsePersistedEventFilterState,
} from "@/features/dashboard/domain/eventSelection"
import { shouldShowGrondahlsStatusCard } from "@/features/dashboard/domain/grondahlsOpening"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { EventFilterBar } from "@/features/dashboard/ui/components/EventFilterBar"
import { EventFiltersModal } from "@/features/dashboard/ui/components/EventFiltersModal"
import { EventGrid } from "@/features/dashboard/ui/components/EventGrid"
import { OpeningStatusHero } from "@/features/dashboard/ui/components/OpeningStatusHero"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { DashboardShellLayout } from "@/shared/ui/DashboardShellLayout"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

const NOW_PLAYING_POLL_INTERVAL_MS = 10_000
const EVENT_FILTER_STORAGE_KEY = "kvarteret_event_filters_sanity:v1"

const clampProgress = (value: number | null): number => {
    if (value === null || !Number.isFinite(value)) return 0
    return Math.min(100, Math.max(0, value))
}

export const KvarteretScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, isLoading } = useSession()
    const { language } = useLanguage()
    const isFocused = useIsFocused()
    const { textPrimary } = useThemeRuntimeColors()
    const [filters, setFilters] = useState<EventFilterState>(() => createEmptyEventFilterState())
    const [filtersHydrated, setFiltersHydrated] = useState(false)
    const [filtersVisible, setFiltersVisible] = useState(false)
    const [restColumns, setRestColumns] = useState<1 | 2>(1)

    useEffect(() => {
        const hydrateFilters = async (): Promise<void> => {
            try {
                const storedFilters = parsePersistedEventFilterState(
                    await getStoredJson<unknown>(EVENT_FILTER_STORAGE_KEY),
                )
                if (storedFilters) setFilters(storedFilters)
            } finally {
                setFiltersHydrated(true)
            }
        }
        void hydrateFilters()
    }, [])

    useEffect(() => {
        if (!filtersHydrated) return
        void setStoredJson(EVENT_FILTER_STORAGE_KEY, filters)
    }, [filters, filtersHydrated])

    const {
        data: events,
        isPending: eventsPending,
        isError: eventsError,
        refetch: refetchEvents,
    } = useQuery({
        queryKey: ["home-events", Boolean(user)],
        queryFn: ({ signal }) => fetchHomeEvents({ includeInternal: Boolean(user) }, signal),
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

    const now = new Date()
    const showOpeningStatusHero =
        !nowPlayingError && shouldShowGrondahlsStatusCard(nowPlaying, now)
    const nowPlayingProgressWidth =
        `${clampProgress(nowPlaying?.progressPercent ?? 0)}%` as `${number}%`

    const taxonomy = useMemo(() => deriveTaxonomyFromEvents(events ?? []), [events])
    const filteredEvents = useMemo(() => filterEvents(events ?? [], filters), [events, filters])
    const eventFeed = useMemo(() => buildEventFeedSections(filteredEvents), [filteredEvents])
    const activeFilterCount = countActiveEventFilters(filters)

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
                {showOpeningStatusHero ? (
                    <OpeningStatusHero
                        title={t("kvarteretOpenStatusTitle")}
                        nowPlaying={nowPlaying ?? null}
                        progressWidth={nowPlayingProgressWidth}
                    />
                ) : null}

                <EventFilterBar
                    activeFilterCount={activeFilterCount}
                    filters={filters}
                    language={language}
                    taxonomy={taxonomy}
                    onChange={setFilters}
                    onOpenFilters={() => setFiltersVisible(true)}
                />

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
                    ) : eventFeed.rest.length > 0 ? (
                        <EventGrid
                            columns={restColumns}
                            entries={eventFeed.rest}
                            onEventPress={eventId => router.push(`/event/${eventId}`)}
                            onPinchColumnsChange={setRestColumns}
                        />
                    ) : (
                        <Text className="text-sm text-text-secondary">{t("homeEventsEmpty")}</Text>
                    )}
                </View>

                <EtjenestenFooter />
            </ScrollView>
            <EventFiltersModal
                eventCount={filteredEvents.length}
                filters={filters}
                language={language}
                taxonomy={taxonomy}
                visible={filtersVisible}
                onChange={setFilters}
                onClose={() => setFiltersVisible(false)}
            />
        </DashboardShellLayout>
    )
}
