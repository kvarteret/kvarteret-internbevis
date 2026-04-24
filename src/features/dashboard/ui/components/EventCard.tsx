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
import { KvarteretEventDocument } from "@/features/dashboard/domain/types"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { triggerSelectionHaptic } from "@/shared/utils/haptics"

export interface EventCardProps {
    event: KvarteretEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
    accessibilityOpenHint: string
    layout?: "carousel" | "featured" | "grid"
}

export const EventCard = ({
    event,
    cardWidth,
    onPress,
    accessibilityOpenHint,
    layout = "carousel",
}: EventCardProps): React.JSX.Element | null => {
    const { t } = useTranslation()
    const { language } = useLanguage()
    if (!event.title.trim()) {
        return null
    }

    const descriptionPreview = selectProjectedDescriptionPreview(event.description)
    const formattedDate = formatEventStart(new Date(event.starts_at), language)
    const taxonomyText = getEventTaxonomyText(event)
    const roomText = getEventRoomText(event)
    const accessibilityLabel = `${event.title}. ${formattedDate}.`
    const imageHeightClassName =
        layout === "featured" ? "h-80" : layout === "grid" ? "h-36" : "h-44"
    const contentClassName = layout === "grid" ? "gap-1.5 p-2.5" : "gap-1.5 p-4"
    const titleClassName =
        layout === "featured"
            ? "text-2xl leading-8 text-editorial-ink font-black"
            : layout === "grid"
              ? "text-base leading-5 text-editorial-ink font-extrabold"
              : "text-lg leading-6 text-editorial-ink font-extrabold"

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
                {event.image_url ? (
                    <CachedImage
                        className={`${imageHeightClassName} w-full`}
                        contentFit="cover"
                        source={event.image_url}
                    />
                ) : (
                    <View className={`${imageHeightClassName} w-full bg-surface-muted`} />
                )}

                <View className={contentClassName}>
                    <Text
                        className="text-xs uppercase tracking-wide text-state-danger font-extrabold"
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
                    <Text className={titleClassName} numberOfLines={2}>
                        {event.title}
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
                    {descriptionPreview && layout !== "grid" ? (
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
