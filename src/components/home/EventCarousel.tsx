import { useQuery } from "@tanstack/react-query"
import React from "react"
import { useTranslation } from "react-i18next"
import {
    FlatList,
    Image,
    ListRenderItem,
    Platform,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from "react-native"
import { platformUi } from "../../constants/platformUi"
import { fetchHomeEvents, selectEventTranslation } from "../../services/eventsService"
import { FirestoreEventDocument } from "../../types/event"
import { triggerSelectionHaptic, triggerSoftImpactHaptic } from "../../utils/haptics"
import { stripHtml } from "../../utils/html"
import { NativeSurface } from "../common/NativeSurface"
import { StateSurface } from "../common/StateSurface"
import { Button } from "../ui/button"

interface EventCarouselProps {
    onEventPress: (eventId: string) => void
}

function formatEventStart(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)
}

function EventCard({
    event,
    cardWidth,
    onPress,
    accessibilityOpenHint,
}: {
    event: FirestoreEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
    accessibilityOpenHint: string
}): React.JSX.Element | null {
    const translation = selectEventTranslation(event.translations)
    if (!translation) {
        return null
    }

    const descriptionPreview = translation.value.description
        ? stripHtml(translation.value.description)
        : ""

    const formattedDate = formatEventStart(event.event_start.toDate())
    const accessibilityLabel = `${translation.value.title}. ${formattedDate}.`

    return (
        <NativeSurface className="mr-3" style={{ width: cardWidth }} variant="grouped">
            <Pressable
                accessibilityHint={accessibilityOpenHint}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                className="p-3"
                onPress={() => {
                    void triggerSelectionHaptic()
                    onPress(event.id)
                }}
                style={({ pressed }) => [
                    Platform.OS === "ios"
                        ? {
                              opacity: pressed ? 0.78 : 1,
                          }
                        : null,
                ]}
            >
                {event.image?.url ? (
                    <Image
                        className="mb-3 h-36 w-full rounded-xl"
                        source={{ uri: event.image.url }}
                    />
                ) : null}

                <Text className="font-inter-semibold text-base text-text-primary" numberOfLines={2}>
                    {translation.value.title}
                </Text>
                <Text className="mt-1 font-inter text-xs text-text-secondary" numberOfLines={1}>
                    {formattedDate}
                </Text>
                {descriptionPreview ? (
                    <Text className="mt-2 font-inter text-sm text-text-secondary" numberOfLines={3}>
                        {descriptionPreview}
                    </Text>
                ) : null}
            </Pressable>
        </NativeSurface>
    )
}

export function EventCarousel({ onEventPress }: EventCarouselProps): React.JSX.Element {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const cardWidth = Math.max(
        width * platformUi.carouselCardWidthRatio,
        platformUi.minCarouselCardWidth,
    )

    const {
        data: events,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["home-events"],
        queryFn: ({ signal }) => fetchHomeEvents(signal),
        staleTime: 30_000,
        retry: 1,
    })

    const renderItem: ListRenderItem<FirestoreEventDocument> = ({ item }) => (
        <EventCard
            accessibilityOpenHint={t("homeEventsOpenHint")}
            event={item}
            cardWidth={cardWidth}
            onPress={onEventPress}
        />
    )

    return (
        <View className="w-full gap-2">
            <Text className="font-inter-bold text-lg text-text-primary">
                {t("homeEventsTitle")}
            </Text>

            {isPending ? (
                <Text className="font-inter text-sm text-text-secondary">
                    {t("homeEventsLoading")}
                </Text>
            ) : null}

            {isError ? (
                <StateSurface className="p-3">
                    <Text className="mb-3 font-inter text-sm text-text-secondary">
                        {t("homeEventsError")}
                    </Text>
                    <Button
                        accessibilityLabel={t("homeEventsRetry")}
                        variant="secondary"
                        onPress={() => {
                            void triggerSoftImpactHaptic()
                            void refetch()
                        }}
                    >
                        <Text className="font-inter-semibold text-base leading-5 text-text-primary">
                            {t("homeEventsRetry")}
                        </Text>
                    </Button>
                </StateSurface>
            ) : null}

            {!isPending && !isError && (!events || events.length === 0) ? (
                <Text className="font-inter text-sm text-text-secondary">
                    {t("homeEventsEmpty")}
                </Text>
            ) : null}

            {!isPending && !isError && events && events.length > 0 ? (
                <FlatList
                    horizontal
                    contentContainerStyle={{ paddingRight: platformUi.carouselCardGap }}
                    data={events}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={cardWidth + platformUi.carouselCardGap}
                />
            ) : null}
        </View>
    )
}
