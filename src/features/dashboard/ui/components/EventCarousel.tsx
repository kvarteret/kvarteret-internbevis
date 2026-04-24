import React from "react"
import { useTranslation } from "react-i18next"
import { FlatList, ListRenderItem, useWindowDimensions, View } from "react-native"
import { KvarteretEventDocument } from "@/features/dashboard/domain/types"
import { EventCard, EventCardProps } from "@/features/dashboard/ui/components/EventCard"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

interface EventCarouselProps {
    events: KvarteretEventDocument[] | undefined
    isPending: boolean
    isError: boolean
    onRetry: () => Promise<unknown>
    onEventPress: (eventId: string) => void
    showTitle?: boolean
    emptyText?: string
    cardLayout?: EventCardProps["layout"]
}

const CAROUSEL_CARD_WIDTH_RATIO = 0.8
const MIN_CAROUSEL_CARD_WIDTH = 240
const CAROUSEL_CARD_GAP = 12

export const EventCarousel = ({
    events,
    isPending,
    isError,
    onRetry,
    onEventPress,
    showTitle = true,
    emptyText,
    cardLayout = "carousel",
}: EventCarouselProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const cardWidth =
        cardLayout === "featured"
            ? width - 32
            : Math.max(width * CAROUSEL_CARD_WIDTH_RATIO, MIN_CAROUSEL_CARD_WIDTH)

    const renderItem: ListRenderItem<KvarteretEventDocument> = ({ item }) => (
        <EventCard
            accessibilityOpenHint={t("homeEventsOpenHint")}
            event={item}
            cardWidth={cardWidth}
            layout={cardLayout}
            onPress={onEventPress}
        />
    )

    const content = (() => {
        if (isPending) {
            return <Text className="text-sm text-text-secondary">{t("homeEventsLoading")}</Text>
        }
        if (isError) {
            return (
                <Card className="gap-3 p-3" effect="liquid" variant="grouped">
                    <Text className="mb-3 text-sm text-text-secondary">{t("homeEventsError")}</Text>
                    <Button
                        accessibilityLabel={t("homeEventsRetry")}
                        variant="secondary"
                        onPress={() => {
                            void triggerSoftImpactHaptic()
                            void onRetry()
                        }}
                    >
                        {t("homeEventsRetry")}
                    </Button>
                </Card>
            )
        }
        if (!events || events.length === 0) {
            return (
                <Text className="text-sm text-text-secondary">
                    {emptyText ?? t("homeEventsEmpty")}
                </Text>
            )
        }
        return (
            <FlatList
                horizontal
                ItemSeparatorComponent={() => <View className="w-3" />}
                contentContainerClassName="px-0.5"
                data={events}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={cardWidth + CAROUSEL_CARD_GAP}
            />
        )
    })()

    return (
        <View className="w-full gap-2.5">
            {showTitle ? <Text className="text-lg font-bold">{t("homeEventsTitle")}</Text> : null}
            {content}
        </View>
    )
}
