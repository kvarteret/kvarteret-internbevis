import React from "react"
import { useTranslation } from "react-i18next"
import { FlatList, ListRenderItem, useWindowDimensions, View } from "react-native"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"
import { EventCard } from "@/features/dashboard/ui/components/EventCard"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

interface EventCarouselProps {
    events: FirestoreEventDocument[] | undefined
    isPending: boolean
    isError: boolean
    onRetry: () => Promise<unknown>
    onEventPress: (eventId: string) => void
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

    const content = (() => {
        if (isPending) {
            return <Text className="text-sm text-text-secondary">{t("homeEventsLoading")}</Text>
        }
        if (isError) {
            return (
                <Card className="gap-3 p-3">
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
                </Card>
            )
        }
        if (!events || events.length === 0) {
            return <Text className="text-sm text-text-secondary">{t("homeEventsEmpty")}</Text>
        }
        return (
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
        )
    })()

    return (
        <View className="w-full gap-2">
            <Text className="text-lg font-bold">{t("homeEventsTitle")}</Text>
            {content}
        </View>
    )
}
