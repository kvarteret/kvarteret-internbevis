import React from "react"
import {
    FlatList,
    Image,
    ListRenderItem,
    Platform,
    Pressable,
    useWindowDimensions,
    View,
} from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"
import { Surface, StateSurface } from "@/shared/ui/Surface"
import { stripHtml } from "@/shared/utils/html"
import { triggerSelectionHaptic, triggerSoftImpactHaptic } from "@/shared/utils/haptics"
import { formatEventStart } from "@/features/dashboard/domain/eventFormatting"
import {
    FirestoreEventDocument,
    EventTranslationSelection,
} from "@/features/dashboard/domain/types"
import { selectEventTranslation } from "@/features/dashboard/domain/eventSelection"

interface EventCarouselProps {
    events: FirestoreEventDocument[] | undefined
    isPending: boolean
    isError: boolean
    onRetry: () => Promise<unknown>
    onEventPress: (eventId: string) => void
}

const CAROUSEL_CARD_WIDTH_RATIO = Platform.OS === "ios" ? 0.78 : 0.82
const MIN_CAROUSEL_CARD_WIDTH = 240
const CAROUSEL_CARD_GAP = 12

interface EventCardProps {
    event: FirestoreEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
    accessibilityOpenHint: string
}

const EventCard = ({
    event,
    cardWidth,
    onPress,
    accessibilityOpenHint,
}: EventCardProps): React.JSX.Element | null => {
    const translation = selectEventTranslation(event.translations)
    if (!translation) {
        return null
    }

    const descriptionPreview = translation.value.description ? stripHtml(translation.value.description) : ""
    const formattedDate = formatEventStart(event.event_start.toDate())
    const accessibilityLabel = `${translation.value.title}. ${formattedDate}.`

    return (
        <Surface className="mr-3" style={{ borderWidth: 0, width: cardWidth }} variant="grouped">
            <Pressable
                accessibilityHint={accessibilityOpenHint}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                onPress={() => {
                    void triggerSelectionHaptic()
                    onPress(event.id)
                }}
                style={({ pressed }) => [
                    Platform.OS === "ios"
                        ? {
                              transform: [{ scale: pressed ? 0.992 : 1 }],
                          }
                        : null,
                ]}
            >
                {event.image?.url ? (
                    <Image className="h-36 w-full" source={{ uri: event.image.url }} />
                ) : null}

                <View className="p-3">
                    <Text className="text-base font-semibold" numberOfLines={2}>
                        {translation.value.title}
                    </Text>
                    <Text className="mt-1 text-xs text-text-secondary" numberOfLines={1}>
                        {formattedDate}
                    </Text>
                    {descriptionPreview ? (
                        <Text className="mt-2 text-sm text-text-secondary" numberOfLines={3}>
                            {descriptionPreview}
                        </Text>
                    ) : null}
                </View>
            </Pressable>
        </Surface>
    )
}

export const EventCarousel = ({
    events,
    isPending,
    isError,
    onRetry,
    onEventPress,
}: EventCarouselProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const cardWidth = Math.max(width * CAROUSEL_CARD_WIDTH_RATIO, MIN_CAROUSEL_CARD_WIDTH)

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
            <Text className="text-lg font-bold">{t("homeEventsTitle")}</Text>

            {isPending ? <Text className="text-sm text-text-secondary">{t("homeEventsLoading")}</Text> : null}

            {isError ? (
                <StateSurface className="p-3">
                    <Text className="mb-3 text-sm text-text-secondary">{t("homeEventsError")}</Text>
                    <Button
                        accessibilityLabel={t("homeEventsRetry")}
                        variant="secondary"
                        onPress={() => {
                            void triggerSoftImpactHaptic()
                            void onRetry()
                        }}
                    >
                        <Text className="text-base leading-5 text-text-primary font-semibold">
                            {t("homeEventsRetry")}
                        </Text>
                    </Button>
                </StateSurface>
            ) : null}

            {!isPending && !isError && (!events || events.length === 0) ? (
                <Text className="text-sm text-text-secondary">{t("homeEventsEmpty")}</Text>
            ) : null}

            {!isPending && !isError && events && events.length > 0 ? (
                <FlatList
                    horizontal
                    contentContainerStyle={{ paddingRight: CAROUSEL_CARD_GAP }}
                    data={events}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={cardWidth + CAROUSEL_CARD_GAP}
                />
            ) : null}
        </View>
    )
}
