import React from "react"
import { useTranslation } from "react-i18next"
import { Image, Pressable, View } from "react-native"
import { useLanguage } from "@/app/providers/LanguageProvider"
import {
    formatEventStart,
    getEventRoomText,
    getEventTaxonomyText,
    getRecurringBadgeText,
    selectProjectedDescriptionPreview,
} from "@/features/dashboard/domain/eventFormatting"
import { selectEventTranslation } from "@/features/dashboard/domain/eventSelection"
import { KvarteretEventDocument } from "@/features/dashboard/domain/types"
import { Card } from "@/shared/ui/Card"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Text } from "@/shared/ui/Text"
import { triggerSelectionHaptic } from "@/shared/utils/haptics"

export interface EventCardProps {
    event: KvarteretEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
    accessibilityOpenHint: string
}

export const EventCard = ({
    event,
    cardWidth,
    onPress,
    accessibilityOpenHint,
}: EventCardProps): React.JSX.Element | null => {
    const { t } = useTranslation()
    const { language } = useLanguage()
    const translation = selectEventTranslation(event.translations)
    if (!translation) {
        return null
    }

    const descriptionPreview = selectProjectedDescriptionPreview(translation.value)
    const formattedDate = formatEventStart(event.event_start.toDate(), language)
    const taxonomyText = getEventTaxonomyText(event)
    const roomText = getEventRoomText(event)
    const accessibilityLabel = `${translation.value.title}. ${formattedDate}.`

    return (
        <Card
            className="overflow-hidden border border-editorial-border bg-editorial-surface"
            effect="liquid"
            style={{ width: cardWidth }}
            variant="grouped"
        >
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
                    {
                        opacity: pressed ? 0.92 : 1,
                        transform: [{ scale: pressed ? 0.994 : 1 }],
                    },
                ]}
            >
                {event.image?.url ? (
                    <CachedImage
                        className="h-44 w-full"
                        contentFit="cover"
                        source={event.image.url}
                    />
                ) : (
                    <View className="h-44 w-full bg-surface-muted" />
                )}

                <View className="gap-1.5 p-4">
                    <Text
                        className="text-xs uppercase tracking-wide text-text-secondary font-semibold"
                        numberOfLines={1}
                    >
                        {formattedDate}
                    </Text>
                    {taxonomyText ? (
                        <Text
                            className="text-xs uppercase tracking-wide text-text-secondary font-semibold"
                            numberOfLines={1}
                        >
                            {taxonomyText}
                        </Text>
                    ) : null}
                    {roomText ? (
                        <Text
                            className="text-xs uppercase tracking-wide text-text-secondary font-semibold"
                            numberOfLines={1}
                        >
                            {roomText}
                        </Text>
                    ) : null}
                    <Text
                        className="text-lg leading-6 text-editorial-ink font-extrabold"
                        numberOfLines={2}
                    >
                        {translation.value.title}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {event.is_featured ? (
                            <Text className="text-xs font-semibold text-editorial-valid">
                                {t("eventFeaturedBadge")}
                            </Text>
                        ) : null}
                        {event.recurring_interval_days ? (
                            <Text className="text-xs font-semibold text-text-secondary">
                                {getRecurringBadgeText(event.recurring_interval_days, language)}
                            </Text>
                        ) : null}
                    </View>
                    {descriptionPreview ? (
                        <Text
                            className="text-sm leading-5 text-editorial-ink-soft"
                            numberOfLines={3}
                        >
                            {descriptionPreview}
                        </Text>
                    ) : null}
                </View>
            </Pressable>
        </Card>
    )
}
