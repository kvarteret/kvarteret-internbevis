import { useQuery } from "@tanstack/react-query"
import React from "react"
import { useTranslation } from "react-i18next"
import {
    FlatList,
    Image,
    ListRenderItem,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from "react-native"
import { fetchHomeEvents, selectEventTranslation } from "../../services/eventsService"
import { FirestoreEventDocument } from "../../types/event"
import { stripHtml } from "../../utils/html"
import { AppButton } from "../common/AppButton"

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
}: {
    event: FirestoreEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
}): React.JSX.Element | null {
    const translation = selectEventTranslation(event.translations)
    if (!translation) {
        return null
    }

    const descriptionPreview = translation.value.description
        ? stripHtml(translation.value.description)
        : ""

    return (
        <Pressable
            className="mr-3 rounded-card border border-border bg-surface p-3"
            style={{ width: cardWidth }}
            onPress={() => onPress(event.id)}
        >
            {event.image?.url ? (
                <Image className="mb-3 h-36 w-full rounded-lg" source={{ uri: event.image.url }} />
            ) : null}

            <Text className="font-inter-semibold text-base text-text-primary" numberOfLines={2}>
                {translation.value.title}
            </Text>
            <Text className="mt-1 font-inter text-xs text-text-secondary" numberOfLines={1}>
                {formatEventStart(event.event_start.toDate())}
            </Text>
            {descriptionPreview ? (
                <Text className="mt-2 font-inter text-sm text-text-secondary" numberOfLines={3}>
                    {descriptionPreview}
                </Text>
            ) : null}
        </Pressable>
    )
}

export function EventCarousel({ onEventPress }: EventCarouselProps): React.JSX.Element {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const cardWidth = Math.max(width * 0.78, 240)

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
        <EventCard event={item} cardWidth={cardWidth} onPress={onEventPress} />
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
                <View className="rounded-card border border-border bg-surface p-3">
                    <Text className="mb-3 font-inter text-sm text-text-secondary">
                        {t("homeEventsError")}
                    </Text>
                    <AppButton
                        secondary
                        text={t("homeEventsRetry")}
                        onPress={() => {
                            void refetch()
                        }}
                    />
                </View>
            ) : null}

            {!isPending && !isError && (!events || events.length === 0) ? (
                <Text className="font-inter text-sm text-text-secondary">
                    {t("homeEventsEmpty")}
                </Text>
            ) : null}

            {!isPending && !isError && events && events.length > 0 ? (
                <FlatList
                    horizontal
                    data={events}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={cardWidth + 12}
                />
            ) : null}
        </View>
    )
}
