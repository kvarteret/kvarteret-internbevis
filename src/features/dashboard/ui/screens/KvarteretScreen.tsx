import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import React, { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Modal,
    NativeTouchEvent,
    PanResponder,
    Pressable,
    ScrollView,
    useWindowDimensions,
    View,
} from "react-native"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { fetchEventTaxonomy, fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import {
    buildEventFeedSections,
    countActiveEventFilters,
    createEmptyEventFilterState,
    EventFilterState,
    filterEvents,
    getLocalizedTaxonomyGroupName,
} from "@/features/dashboard/domain/eventSelection"
import { shouldShowGrondahlsStatusCard } from "@/features/dashboard/domain/grondahlsOpening"
import { EventTaxonomy, KvarteretEventDocument } from "@/features/dashboard/domain/types"
import { DashboardShellLayout } from "@/features/dashboard/ui/components/DashboardShellLayout"
import { EventCard } from "@/features/dashboard/ui/components/EventCard"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { fetchNowPlaying, NowPlayingState } from "@/features/now-playing/data/nowPlayingRepository"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Button } from "@/shared/ui/Button"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

const NOW_PLAYING_POLL_INTERVAL_MS = 10_000
const TAXONOMY_GROUP_ORDER = ["Musikk", "Scenekunst", "Faglig", "Sosialt", "Organisasjon"]
const GRID_CARD_GAP = 10

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
    events: KvarteretEventDocument[]
    onRetry: () => Promise<unknown>
    onEventPress: (eventId: string) => void
    layout?: "carousel" | "grid"
    columns?: 1 | 2
    onPinchColumnsChange?: (columns: 1 | 2) => void
    showCount?: boolean
}

const getTouchDistance = (touches: NativeTouchEvent["touches"]): number | null => {
    const [firstTouch, secondTouch] = touches
    if (!firstTouch || !secondTouch) {
        return null
    }

    return Math.hypot(firstTouch.pageX - secondTouch.pageX, firstTouch.pageY - secondTouch.pageY)
}

const EventSection = ({
    title,
    events,
    onRetry,
    onEventPress,
    layout = "carousel",
    columns = 1,
    onPinchColumnsChange,
    showCount = false,
}: EventSectionProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const pinchDistanceRef = useRef<number | null>(null)
    const listCardWidth = columns === 2 ? (width - 32 - GRID_CARD_GAP) / 2 : width - 32
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: event => event.nativeEvent.touches.length === 2,
                onStartShouldSetPanResponder: event => event.nativeEvent.touches.length === 2,
                onPanResponderGrant: event => {
                    pinchDistanceRef.current = getTouchDistance(event.nativeEvent.touches)
                },
                onPanResponderMove: event => {
                    const initialDistance = pinchDistanceRef.current
                    const currentDistance = getTouchDistance(event.nativeEvent.touches)
                    if (!initialDistance || !currentDistance || !onPinchColumnsChange) {
                        return
                    }

                    const scale = currentDistance / initialDistance
                    if (scale < 0.86) {
                        onPinchColumnsChange(2)
                    } else if (scale > 1.14) {
                        onPinchColumnsChange(1)
                    }
                },
                onPanResponderRelease: () => {
                    pinchDistanceRef.current = null
                },
                onPanResponderTerminate: () => {
                    pinchDistanceRef.current = null
                },
            }),
        [onPinchColumnsChange],
    )

    return (
        <View className="w-full gap-2.5">
            <View className="flex-row items-center justify-between px-1">
                <Text className="text-2xl leading-8 text-editorial-ink font-black">{title}</Text>
                {layout === "grid" || showCount ? (
                    <Text className="text-xs uppercase tracking-widest text-editorial-action font-extrabold">
                        {t("eventSectionCount", { count: events.length })}
                    </Text>
                ) : null}
            </View>
            {layout === "grid" ? (
                <View
                    className={columns === 2 ? "flex-row flex-wrap gap-2.5" : "gap-3"}
                    {...panResponder.panHandlers}
                >
                    {events.map(event => (
                        <EventCard
                            accessibilityOpenHint=""
                            cardWidth={listCardWidth}
                            event={event}
                            key={event.id}
                            layout="grid"
                            onPress={onEventPress}
                        />
                    ))}
                </View>
            ) : (
                <EventCarousel
                    events={events}
                    isPending={false}
                    isError={false}
                    onRetry={onRetry}
                    onEventPress={onEventPress}
                    showTitle={false}
                />
            )}
        </View>
    )
}

interface FilterChipProps {
    label: string
    selected: boolean
    onPress: () => void
    variant?: "filled" | "outlined"
}

const FilterChip = ({
    label,
    selected,
    onPress,
    variant = "filled",
}: FilterChipProps): React.JSX.Element => (
    <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`h-12 items-center justify-center rounded-none px-5 ${
            variant === "outlined" ? "border-2 border-editorial-ink" : ""
        } ${selected ? "bg-editorial-ink" : "bg-surface-muted"}`}
        onPress={onPress}
    >
        <Text
            className={`text-base font-extrabold ${
                selected ? "text-editorial-surface" : "text-editorial-ink"
            }`}
        >
            {label}
        </Text>
    </Pressable>
)

const toggleFilterValue = (values: string[], value: string): string[] =>
    values.includes(value) ? values.filter(item => item !== value) : [...values, value]

const getQuickTaxonomyGroups = (taxonomy: EventTaxonomy | undefined): string[] => {
    const availableGroups = new Set(taxonomy?.event_type_groups.map(group => group.name) ?? [])
    return TAXONOMY_GROUP_ORDER.filter(groupName => availableGroups.has(groupName))
}

interface EventFilterBarProps {
    activeFilterCount: number
    filters: EventFilterState
    language: "no" | "en"
    taxonomy: EventTaxonomy | undefined
    onChange: (filters: EventFilterState) => void
    onOpenFilters: () => void
}

const EventFilterBar = ({
    activeFilterCount,
    filters,
    language,
    taxonomy,
    onChange,
    onOpenFilters,
}: EventFilterBarProps): React.JSX.Element => {
    const { t } = useTranslation()
    const quickGroups = getQuickTaxonomyGroups(taxonomy)

    return (
        <View className="gap-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-4">
                    <FilterChip
                        label={t("eventFilterAll")}
                        selected={countActiveEventFilters(filters) === 0}
                        onPress={() => onChange(createEmptyEventFilterState())}
                    />
                    {quickGroups.map(groupName => (
                        <FilterChip
                            key={groupName}
                            label={getLocalizedTaxonomyGroupName(groupName, language)}
                            selected={
                                filters.taxonomyGroup === groupName &&
                                filters.eventTypeIds.length === 0
                            }
                            onPress={() =>
                                onChange({
                                    ...filters,
                                    eventTypeIds: [],
                                    taxonomyGroup:
                                        filters.taxonomyGroup === groupName ? null : groupName,
                                })
                            }
                        />
                    ))}
                    <FilterChip
                        label={
                            activeFilterCount > 0
                                ? `${t("eventFilterMore")} (${activeFilterCount})`
                                : t("eventFilterMore")
                        }
                        selected={
                            filters.eventTypeIds.length > 0 || filters.organizerGroupIds.length > 0
                        }
                        onPress={onOpenFilters}
                    />
                </View>
            </ScrollView>
        </View>
    )
}

interface EventFiltersModalProps {
    eventCount: number
    filters: EventFilterState
    language: "no" | "en"
    taxonomy: EventTaxonomy | undefined
    visible: boolean
    onChange: (filters: EventFilterState) => void
    onClose: () => void
}

const EventFiltersModal = ({
    eventCount,
    filters,
    language,
    taxonomy,
    visible,
    onChange,
    onClose,
}: EventFiltersModalProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/25">
                <View className="max-h-[88%] rounded-t-3xl bg-background px-5 pb-8 pt-5">
                    <View className="mb-5 flex-row items-center justify-between">
                        <Text className="text-3xl text-editorial-ink font-black">
                            {t("eventFilterTitle")}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => onChange(createEmptyEventFilterState())}
                        >
                            <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                                {t("eventFilterReset")}
                            </Text>
                        </Pressable>
                    </View>
                    <ScrollView contentContainerClassName="gap-7">
                        <View className="gap-5">
                            <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                                {t("eventFilterType")}
                            </Text>
                            {taxonomy?.event_type_groups.map(group => (
                                <View className="gap-3" key={group.name}>
                                    <Text className="text-4xl leading-tight text-editorial-ink font-black">
                                        {getLocalizedTaxonomyGroupName(group.name, language)}
                                    </Text>
                                    <View className="flex-row flex-wrap gap-3">
                                        {group.event_types.map(eventType => (
                                            <FilterChip
                                                key={eventType.id}
                                                label={eventType.name}
                                                selected={filters.eventTypeIds.includes(
                                                    eventType.id,
                                                )}
                                                onPress={() =>
                                                    onChange({
                                                        ...filters,
                                                        eventTypeIds: toggleFilterValue(
                                                            filters.eventTypeIds,
                                                            eventType.id,
                                                        ),
                                                        taxonomyGroup: null,
                                                    })
                                                }
                                                variant="outlined"
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View className="gap-3 border-t border-border-soft pt-6">
                            <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                                {t("eventFilterOrganizer")}
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {taxonomy?.organizer_groups.map(group => (
                                    <FilterChip
                                        key={group.id}
                                        label={group.name}
                                        selected={filters.organizerGroupIds.includes(group.id)}
                                        onPress={() =>
                                            onChange({
                                                ...filters,
                                                organizerGroupIds: toggleFilterValue(
                                                    filters.organizerGroupIds,
                                                    group.id,
                                                ),
                                            })
                                        }
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    <Button className="mt-6" onPress={onClose}>
                        {t("eventFilterShowCount", { count: eventCount })}
                    </Button>
                </View>
            </View>
        </Modal>
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
    const { user, isLoading } = useSession()
    const { language } = useLanguage()
    const isFocused = useIsFocused()
    const { textPrimary } = useThemeRuntimeColors()
    const [filters, setFilters] = useState<EventFilterState>(() => createEmptyEventFilterState())
    const [filtersVisible, setFiltersVisible] = useState(false)
    const [restColumns, setRestColumns] = useState<1 | 2>(1)

    const {
        data: events,
        isPending: eventsPending,
        isError: eventsError,
        refetch: refetchEvents,
    } = useQuery({
        queryKey: ["home-events", Boolean(user), language],
        queryFn: ({ signal }) =>
            fetchHomeEvents(
                {
                    includeInternal: Boolean(user),
                    language,
                },
                signal,
            ),
        staleTime: 30_000,
        retry: 1,
    })

    const { data: eventTaxonomy } = useQuery({
        queryKey: ["event-taxonomy"],
        queryFn: ({ signal }) => fetchEventTaxonomy(signal),
        staleTime: 5 * 60_000,
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
    const filteredEvents = useMemo(() => filterEvents(events ?? [], filters), [events, filters])
    const eventFeed = useMemo(() => buildEventFeedSections(filteredEvents), [filteredEvents])
    const activeFilterCount = countActiveEventFilters(filters)
    const renderedEventSections = useMemo(
        () =>
            [
                {
                    events: eventFeed.today,
                    key: "today",
                    layout: "carousel" as const,
                    title: t("eventFeedToday"),
                },
                {
                    events: eventFeed.soon,
                    key: "soon",
                    layout: "carousel" as const,
                    showCount: true,
                    title: t("eventFeedSoon"),
                },
                {
                    columns: restColumns,
                    events: eventFeed.rest,
                    key: "rest",
                    layout: "grid" as const,
                    onPinchColumnsChange: setRestColumns,
                    title: t("eventFeedRest"),
                },
            ]
                .filter(section => section.events.length > 0)
                .map(section => (
                    <EventSection
                        events={section.events}
                        key={section.key}
                        layout={section.layout}
                        columns={section.columns}
                        showCount={section.showCount}
                        title={section.title}
                        onPinchColumnsChange={section.onPinchColumnsChange}
                        onRetry={async () => refetchEvents()}
                        onEventPress={eventId => router.push(`/event/${eventId}`)}
                    />
                )),
        [eventFeed, refetchEvents, restColumns, router, t],
    )

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

                <EventFilterBar
                    activeFilterCount={activeFilterCount}
                    filters={filters}
                    language={language}
                    taxonomy={eventTaxonomy}
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
                    ) : (
                        <View className="w-full gap-5">
                            {eventFeed.featured.length > 0 ? (
                                <EventCarousel
                                    events={eventFeed.featured}
                                    isPending={false}
                                    isError={false}
                                    onRetry={async () => refetchEvents()}
                                    onEventPress={eventId => router.push(`/event/${eventId}`)}
                                    showTitle={false}
                                    cardLayout="featured"
                                />
                            ) : null}
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
            <EventFiltersModal
                eventCount={filteredEvents.length}
                filters={filters}
                language={language}
                taxonomy={eventTaxonomy}
                visible={filtersVisible}
                onChange={setFilters}
                onClose={() => setFiltersVisible(false)}
            />
        </DashboardShellLayout>
    )
}
